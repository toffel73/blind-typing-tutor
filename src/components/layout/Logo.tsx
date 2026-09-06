import Image from "next/image";

interface LogoProps {
  /** Rendered pixel height of the logo; width scales automatically to preserve aspect ratio. */
  height?: number;
  className?: string;
  priority?: boolean;
}

/**
 * OCK brand logo. Reused across the login page, dashboard, learning page
 * header and admin pages so the branding stays consistent in one place.
 */
export function Logo({ height = 32, className = "", priority = false }: LogoProps) {
  // Source image is 814x218 — keep that aspect ratio when scaling by height.
  const width = Math.round((814 / 218) * height);

  return (
    <Image
      src="/img/ock-logo.png"
      alt="OCK"
      width={width}
      height={height}
      priority={priority}
      className={`object-contain ${className}`}
    />
  );
}
