interface Post {
  postCreatedAt: Date;
}

export function calculateStreak(posts: Post[]): number {
  if (posts.length === 0) {
    return 0;
  }

  let streak = 1;
  const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day

  for (let i = 0; i < posts.length - 1; i++) {
    const currentDate = new Date(posts[i].postCreatedAt);
    const nextDate = new Date(posts[i + 1].postCreatedAt);

    // Check the time difference between the current post and the next post
    const diff = currentDate.getTime() - nextDate.getTime();

    if (diff <= oneDay) {
      // Check if we haven't already counted a post for this day
      if (currentDate.toDateString() !== nextDate.toDateString()) {
        streak++;
      }
    } else {
      // If the difference is more than one day, break the streak
      break;
    }
  }

  return streak;
}
