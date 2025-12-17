// Props type for the inline loading component
interface InlineLoadingProps {
  size?: "sm" | "md" | "lg";
  status?: "active" | "finished" | "error";
}

// Size class mapping for different spinner sizes
const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

// InlineLoading component displays a spinner, checkmark, or error icon based on status
export const InlineLoading = ({ size = "md", status = "active" }: InlineLoadingProps) => {
  // Finished state - green checkmark
  if (status === "finished") {
    return (
      <svg
        className={`${sizeClasses[size]} text-green-600`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M5 13l4 4L19 7"
        />
      </svg>
    );
  }

  // Error state - red X
  if (status === "error") {
    return (
      <svg
        className={`${sizeClasses[size]} text-red-600`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    );
  }

  // Active state - spinning loader
  return (
    <svg
      className={`${sizeClasses[size]} animate-spin text-blue-600`}
      viewBox="0 0 24 24"
      fill="none"
    >
      {/* Background circle with low opacity */}
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      {/* Animated arc segment */}
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};