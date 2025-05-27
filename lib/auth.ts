import { supabase } from "./supabase"

export const signUp = async (email: string, password: string, fullName: string) => {
  try {
    // Get the current origin for redirect URL
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined

    // First, sign up the user with proper redirect URL
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: redirectTo,
      },
    })

    if (error) throw error

    // Wait a moment for the user to be fully created in auth.users
    if (data.user && data.user.id) {
      // Add a small delay to ensure the auth.users record is committed
      await new Promise((resolve) => setTimeout(resolve, 1000))

      try {
        // Check if profile already exists first
        const { data: existingProfile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle()

        if (!existingProfile) {
          const { error: profileError } = await supabase.from("user_profiles").insert([
            {
              user_id: data.user.id,
              full_name: fullName,
              daily_calories: 2000,
              daily_protein: 150,
              daily_carbs: 250,
              daily_fat: 67,
              goal_type: "maintenance",
            },
          ])

          if (profileError) {
            console.error("Profile creation error:", profileError)
            // Don't throw here - user is created, profile can be created later
          }
        }
      } catch (profileErr) {
        console.error("Failed to create user profile:", profileErr)
        // Profile creation failed, but user signup succeeded
      }
    }

    return data
  } catch (error) {
    console.error("Signup error:", error)
    throw error
  }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export const signInWithGoogle = async () => {
  try {
    // Check if we're in a development environment
    const isDevelopment = typeof window !== "undefined" && window.location.hostname === "localhost"

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
        // Skip redirect in development if OAuth is not configured
        skipBrowserRedirect: isDevelopment,
      },
    })

    if (error) {
      console.error("Google OAuth error:", error)

      // Provide more specific error messages
      if (error.message?.includes("Invalid provider")) {
        throw new Error("Google authentication is not configured. Please use email authentication.")
      } else if (error.message?.includes("redirect_uri_mismatch")) {
        throw new Error("OAuth redirect URL mismatch. Please contact support.")
      } else if (error.message?.includes("access_denied")) {
        throw new Error("Google sign-in was cancelled.")
      }

      throw error
    }

    return data
  } catch (error) {
    console.error("Google sign-in error:", error)
    throw error
  }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export const getUserProfile = async (userId: string) => {
  try {
    // Use maybeSingle() to handle cases where there might be 0 or 1 rows
    const { data, error } = await supabase.from("user_profiles").select("*").eq("user_id", userId).maybeSingle()

    if (error) {
      console.error("Error fetching user profile:", error)
      throw error
    }

    // If no profile found, return null instead of throwing
    if (!data) {
      console.log("No user profile found for user:", userId)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getUserProfile:", error)
    throw error
  }
}

export const ensureUserProfile = async (userId: string, fullName: string) => {
  try {
    // Check if profile exists using maybeSingle()
    const { data: existingProfile, error: fetchError } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle()

    if (fetchError) {
      console.error("Error checking existing profile:", fetchError)
      throw fetchError
    }

    if (!existingProfile) {
      // Create profile if it doesn't exist
      const { data: newProfile, error: insertError } = await supabase
        .from("user_profiles")
        .insert([
          {
            user_id: userId,
            full_name: fullName,
            daily_calories: 2000,
            daily_protein: 150,
            daily_carbs: 250,
            daily_fat: 67,
            goal_type: "maintenance",
          },
        ])
        .select()
        .single()

      if (insertError) {
        console.error("Error creating user profile:", insertError)
        throw insertError
      }

      return newProfile
    }

    return existingProfile
  } catch (error) {
    console.error("Error ensuring user profile:", error)
    throw error
  }
}

export const createOrUpdateUserProfile = async (userId: string, fullName: string) => {
  try {
    // Use upsert to either insert or update
    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(
        {
          user_id: userId,
          full_name: fullName,
          daily_calories: 2000,
          daily_protein: 150,
          daily_carbs: 250,
          daily_fat: 67,
          goal_type: "maintenance",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      )
      .select()
      .single()

    if (error) {
      console.error("Error upserting user profile:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in createOrUpdateUserProfile:", error)
    throw error
  }
}

// Handle auth callback from email confirmation
export const handleAuthCallback = async () => {
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Auth callback error:", error)
      throw error
    }

    if (data.session?.user) {
      // User is authenticated, ensure profile exists
      const userDisplayName =
        data.session.user.user_metadata?.full_name || data.session.user.email?.split("@")[0] || "User"

      await createOrUpdateUserProfile(data.session.user.id, userDisplayName)
    }

    return data
  } catch (error) {
    console.error("Error handling auth callback:", error)
    throw error
  }
}
