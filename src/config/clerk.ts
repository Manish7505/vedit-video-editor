// Clerk configuration
export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''

export const isClerkEnabled = () => !!clerkPublishableKey
