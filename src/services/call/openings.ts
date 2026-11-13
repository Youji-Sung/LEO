import type { ThemeId } from "@/services/claude/types";
import { THEMES } from "@/services/claude/prompts/themes";

const variants: Record<ThemeId, string[]> = {
  free: [
    "Hey! What's something interesting you noticed this week?",
    "Hi! If you had a free afternoon today, how would you spend it?",
    "Hey! Tell me about something you've been enjoying lately.",
  ],
  interview: [
    "Hi, thanks for joining. Could you walk me through a project you're proud of?",
    "Welcome! Let's start with a challenge you faced at work. What happened?",
    "Hi! What kind of engineering work do you find most rewarding, and why?",
  ],
  daily: [
    "Hi! Welcome to our cafe. What can I get started for you?",
    "Hi there! I'm looking for somewhere to have lunch. What would you recommend?",
    "Hello! Thanks for calling about the apartment. What would you like to know?",
  ],
  work: [
    "Hey! Could you help me think through a tricky code review? How do you usually approach one?",
    "Hi! Let's plan our next piece of work. What should we tackle first?",
    "Hey! I have a few minutes before our meeting. Is there anything you'd like a hand with?",
  ],
  business: [
    "Hi! Before we discuss a solution, could you tell me which requirement matters most?",
    "Hello! Let's talk about the project timeline. What do you need to clarify first?",
    "Hi! We have two possible approaches to discuss. How would you compare their trade-offs?",
  ],
  portfolio: [
    "Hi! Looking at your portfolio, which design decision would you like to walk me through?",
    "Welcome! Pick a project from your portfolio. What was the hardest problem to solve?",
    "Hi! Which part of a project in your portfolio would you approach differently today?",
  ],
};
export function chooseOpening(theme: ThemeId, recent: string[]): string {
  const choices = [THEMES[theme].openingLine, ...variants[theme]];
  return (
    choices.find((line) => !recent.includes(line)) ?? choices.find((line) => line !== recent[0])!
  );
}
