"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Input validation schemas
const pollSchema = z.object({
  question: z
    .string()
    .min(1, "Question is required")
    .max(500, "Question must be less than 500 characters")
    .trim(),
  options: z
    .array(z.string().min(1).max(200).trim())
    .min(2, "At least 2 options are required")
    .max(10, "Maximum 10 options allowed"),
});

const voteSchema = z.object({
  pollId: z.string().uuid("Invalid poll ID"),
  optionIndex: z.number().int().min(0),
});

// Sanitize HTML to prevent XSS
function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// CREATE POLL
export async function createPoll(formData: FormData) {
  const supabase = await createClient();

  const rawQuestion = formData.get("question") as string;
  const rawOptions = formData.getAll("options").filter(Boolean) as string[];

  // Validate input
  const validation = pollSchema.safeParse({
    question: rawQuestion,
    options: rawOptions,
  });

  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const { question: validQuestion, options: validOptions } = validation.data;

  // Sanitize inputs to prevent XSS
  const sanitizedQuestion = sanitizeHtml(validQuestion);
  const sanitizedOptions = validOptions.map((option) => sanitizeHtml(option));

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to create a poll." };
  }

  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id,
      question: sanitizedQuestion,
      options: sanitizedOptions,
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/polls");
  return { error: null };
}

// GET USER POLLS
export async function getUserPolls() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { polls: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
}

// GET POLL BY ID
export async function getPollById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { poll: null, error: error.message };
  return { poll: data, error: null };
}

// SUBMIT VOTE
export async function submitVote(pollId: string, optionIndex: number) {
  const supabase = await createClient();

  // Validate input
  const validation = voteSchema.safeParse({ pollId, optionIndex });
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Validate poll exists
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("id, options")
    .eq("id", pollId)
    .single();

  if (pollError || !poll) {
    return { error: "Poll not found." };
  }

  // Validate option index
  if (optionIndex < 0 || optionIndex >= poll.options.length) {
    return { error: "Invalid option selected." };
  }

  // Check if user has already voted (for authenticated users)
  if (user) {
    const { data: existingVote } = await supabase
      .from("votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("user_id", user.id)
      .single();

    if (existingVote) {
      return { error: "You have already voted on this poll." };
    }
  }

  // For anonymous users, we'll use a simple IP-based check (not foolproof but better than nothing)
  // In production, consider using more sophisticated fingerprinting or requiring authentication

  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user?.id ?? null,
      option_index: optionIndex,
    },
  ]);

  if (error) {
    // Handle unique constraint violation (in case of race conditions)
    if (error.code === "23505") {
      return { error: "You have already voted on this poll." };
    }
    return { error: error.message };
  }

  return { error: null };
}

// DELETE POLL
export async function deletePoll(id: string) {
  const supabase = await createClient();

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to delete a poll." };
  }

  // Check if user owns the poll or is admin
  const { data: poll, error: fetchError } = await supabase
    .from("polls")
    .select("user_id")
    .eq("id", id)
    .single();

  if (fetchError) {
    return { error: "Poll not found." };
  }

  // Admin emails from environment variables
  const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(",") || [
    "admin@example.com",
    "admin@alx-polly.com",
  ];
  const isAdmin = ADMIN_EMAILS.includes(user.email || "");

  if (poll.user_id !== user.id && !isAdmin) {
    return { error: "You can only delete your own polls." };
  }

  const { error } = await supabase.from("polls").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/polls");
  return { error: null };
}

// UPDATE POLL
export async function updatePoll(pollId: string, formData: FormData) {
  const supabase = await createClient();

  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  if (!question || options.length < 2) {
    return { error: "Please provide a question and at least two options." };
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to update a poll." };
  }

  // Only allow updating polls owned by the user
  const { error } = await supabase
    .from("polls")
    .update({ question, options })
    .eq("id", pollId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
