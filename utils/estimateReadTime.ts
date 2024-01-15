export function estimateReadTime(text: string): number {
  const wordsPerMinute = 225; // Average reading speed
  const words = text.split(/\s+/).length; // Split text into words
  const readTime = Math.ceil(words / wordsPerMinute);
  return readTime;
}
