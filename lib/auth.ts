import { supabase } from "./supabase"

export const signUp = async (email: string, password: string, fullName: string) => {
  try {
    // First, sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) throw error

    // Wait a moment for the user to be fully created in auth.users
    if (data.user && data.user.id) {
      // Add a small delay to ensure the auth.users record is committed
      await new Promise((resolve) => setTimeout(resolve, 1000))

      try {
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
  const { data, error } = await supabase.from("user_profiles").select("*").eq("user_id", userId).single()

  if (error) throw error
  return data
}

export const ensureUserProfile = async (userId: string, fullName: string) => {
  try {
    // Check if profile exists
    const { data: existingProfile } = await supabase.from("user_profiles").select("id").eq("user_id", userId).single()

    if (!existingProfile) {
      // Create profile if it doesn't exist
      const { error } = await supabase.from("user_profiles").insert([
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

      if (error) throw error
    }
  } catch (error) {
    console.error("Error ensuring user profile:", error)
    throw error
  }
}
