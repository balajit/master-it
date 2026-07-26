import type { components } from "../api/v1.d.ts";

type StudyPlanLesson = components["schemas"]["StudyPlanLesson"];
type StudyPlanMilestone = components["schemas"]["StudyPlanMilestone"];
type StudyPlanCheckpoint = components["schemas"]["StudyPlanCheckpoint"];

export interface LessonContent {
  lessonId: string;
  html: string;
}

const CHECKPOINT_CONTENT: Record<string, string> = {
  quiz: `
    <h3>Knowledge Check</h3>
    <p>Test your understanding of the concepts covered in this milestone.</p>
    <div class="mock-quiz">
      <p><strong>Question 1:</strong> What is the primary purpose of this section?</p>
      <ul>
        <li>A) To introduce new vocabulary</li>
        <li>B) To reinforce key concepts</li>
        <li>C) To provide advanced techniques</li>
        <li>D) To review prerequisite material</li>
      </ul>
      <p class="quiz-answer"><em>Correct answer: B</em></p>
      <p><strong>Question 2:</strong> Which of the following best describes the relationship between these concepts?</p>
      <ul>
        <li>A) They are independent of each other</li>
        <li>B) They build upon each other progressively</li>
        <li>C) They are alternative approaches</li>
        <li>D) They contradict each other</li>
      </ul>
      <p class="quiz-answer"><em>Correct answer: B</em></p>
    </div>
  `,
  practice: `
    <h3>Practice Exercise</h3>
    <p>Apply what you've learned with this hands-on exercise.</p>
    <div class="mock-exercise">
      <p><strong>Exercise:</strong> Using the concepts from the previous lessons, complete the following task:</p>
      <ol>
        <li>Identify the key components of the problem</li>
        <li>Break down the solution into smaller steps</li>
        <li>Implement each step individually</li>
        <li>Test your solution with the provided examples</li>
      </ol>
      <p><strong>Expected time:</strong> 15-20 minutes</p>
    </div>
  `,
  project: `
    <h3>Project</h3>
    <p>Build something real with the skills you've acquired.</p>
    <div class="mock-project">
      <p><strong>Project Goal:</strong> Create a complete implementation that demonstrates mastery of the milestone topics.</p>
      <p><strong>Requirements:</strong></p>
      <ul>
        <li>Apply all major concepts covered in the lessons</li>
        <li>Follow best practices and conventions</li>
        <li>Include appropriate error handling</li>
        <li>Write clean, readable code</li>
      </ul>
      <p><strong>Deliverable:</strong> A working implementation with documentation.</p>
    </div>
  `,
  self_test: `
    <h3>Self-Assessment</h3>
    <p>Reflect on your learning and identify areas for improvement.</p>
    <div class="mock-selftest">
      <p><strong>Checklist:</strong></p>
      <ul>
        <li>Can I explain the core concepts in my own words?</li>
        <li>Can I apply these concepts to new problems?</li>
        <li>Can I identify when to use each approach?</li>
        <li>Am I comfortable with the terminology?</li>
      </ul>
      <p>If you answered "no" to any of these, review the relevant lessons before moving on.</p>
    </div>
  `,
};

function getLessonTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    introduction: "Introduction",
    core: "Core Lesson",
    advanced: "Advanced Topic",
    review: "Review",
  };
  return labels[type] ?? type;
}

function getMockContent(lesson: StudyPlanLesson): string {
  const typeLabel = getLessonTypeLabel(lesson.lesson_type);

  if (lesson.lesson_type === "introduction") {
    return `
      <div class="lesson-header">
        <span class="lesson-type-badge introduction">${typeLabel}</span>
        <span class="lesson-difficulty">${lesson.difficulty}</span>
        <span class="lesson-time">${lesson.estimated_minutes} min read</span>
      </div>
      <h2>${lesson.title}</h2>
      <p class="lesson-description">${lesson.description}</p>
      <h3>What You'll Learn</h3>
      <ul class="objectives">
        <li>Understand the fundamental concepts behind ${lesson.title.toLowerCase()}</li>
        <li>Identify the key components and their relationships</li>
        <li>Apply basic principles to simple scenarios</li>
      </ul>
      <h3>Overview</h3>
      <p>This lesson introduces you to <strong>${lesson.title}</strong>. We'll start with the basics and build a solid foundation for the more advanced topics that follow.</p>
      <p>By the end of this lesson, you should be comfortable with the core terminology and have a clear mental model of how these concepts fit together.</p>
      <div class="callout">
        <strong>Prerequisites:</strong> No prior knowledge is assumed. This lesson is designed for beginners.
      </div>
      <h3>Key Concepts</h3>
      <p>The foundation of ${lesson.title.toLowerCase()} rests on several core principles:</p>
      <ol>
        <li><strong>Concept A</strong> — The basic building block that everything else depends on</li>
        <li><strong>Concept B</strong> — How concepts interact and relate to each other</li>
        <li><strong>Concept C</strong> — The practical applications in real-world scenarios</li>
      </ol>
      <p>These three concepts form the basis for everything we'll cover in this course. Take time to understand each one before moving forward.</p>
      <div class="tip">
        <strong>Study Tip:</strong> Try explaining these concepts to someone else. If you can teach it, you understand it.
      </div>
    `;
  }

  if (lesson.lesson_type === "core") {
    return `
      <div class="lesson-header">
        <span class="lesson-type-badge core">${typeLabel}</span>
        <span class="lesson-difficulty">${lesson.difficulty}</span>
        <span class="lesson-time">${lesson.estimated_minutes} min read</span>
      </div>
      <h2>${lesson.title}</h2>
      <p class="lesson-description">${lesson.description}</p>
      <h3>In-Depth Explanation</h3>
      <p>This lesson covers the core material of <strong>${lesson.title}</strong> in detail. We'll explore each aspect thoroughly with examples and practical applications.</p>
      <h3>Detailed Breakdown</h3>
      <p>Understanding ${lesson.title.toLowerCase()} requires grasping several interconnected ideas. Let's break them down one by one.</p>
      <div class="code-block">
        <pre><code>// Example: Applying ${lesson.title}
const result = application({
  step1: "Understand the problem",
  step2: "Identify the pattern",
  step3: "Apply the solution",
  step4: "Verify the outcome"
});

console.log(result);
// Output: { success: true, confidence: "high" }</code></pre>
      </div>
      <h3>How It Works</h3>
      <p>The mechanism behind this works in three phases:</p>
      <ol>
        <li><strong>Initialization</strong> — Setting up the necessary components and context</li>
        <li><strong>Processing</strong> — Applying the core logic to transform input to output</li>
        <li><strong>Validation</strong> — Ensuring the result meets the expected criteria</li>
      </ol>
      <h3>Common Patterns</h3>
      <p>When working with ${lesson.title.toLowerCase()}, you'll frequently encounter these patterns:</p>
      <ul>
        <li><strong>Pattern 1:</strong> Sequential processing — Handle items one at a time in order</li>
        <li><strong>Pattern 2:</strong> Parallel processing — Handle multiple items simultaneously</li>
        <li><strong>Pattern 3:</strong> Event-driven — React to changes and triggers</li>
      </ul>
      <div class="callout">
        <strong>Important:</strong> Understanding these patterns is crucial. They appear repeatedly in real-world applications.
      </div>
      <h3>Practical Example</h3>
      <p>Let's walk through a concrete example. Imagine you need to implement a system that processes user requests efficiently.</p>
      <p>The key insight is that by understanding the underlying principles of ${lesson.title.toLowerCase()}, you can design solutions that are both efficient and maintainable.</p>
      <div class="tip">
        <strong>Practice:</strong> Try modifying the example above to handle edge cases. What happens with empty input? What about very large inputs?
      </div>
    `;
  }

  if (lesson.lesson_type === "advanced") {
    return `
      <div class="lesson-header">
        <span class="lesson-type-badge advanced">${typeLabel}</span>
        <span class="lesson-difficulty">${lesson.difficulty}</span>
        <span class="lesson-time">${lesson.estimated_minutes} min read</span>
      </div>
      <h2>${lesson.title}</h2>
      <p class="lesson-description">${lesson.description}</p>
      <div class="callout warning">
        <strong>Note:</strong> This is an advanced topic. Make sure you're comfortable with the core concepts before proceeding.
      </div>
      <h3>Advanced Concepts</h3>
      <p>Building on the foundations, this lesson explores the more nuanced and powerful aspects of <strong>${lesson.title}</strong>.</p>
      <h3>Deep Dive</h3>
      <p>At an advanced level, ${lesson.title.toLowerCase()} involves understanding not just <em>what</em> happens, but <em>why</em> it happens and <em>how</em> to optimize for specific scenarios.</p>
      <div class="code-block">
        <pre><code>// Advanced pattern: ${lesson.title}
class AdvancedHandler {
  private cache = new Map();
  private metrics = { hits: 0, misses: 0 };

  async process(input: ComplexInput): Promise<Result> {
    const key = this.computeKey(input);

    if (this.cache.has(key)) {
      this.metrics.hits++;
      return this.cache.get(key)!;
    }

    this.metrics.misses++;
    const result = await this.expensiveComputation(input);
    this.cache.set(key, result);

    return result;
  }

  getStats() {
    return { ...this.metrics, ratio: this.metrics.hits / (this.metrics.hits + this.metrics.misses) };
  }
}</code></pre>
      </div>
      <h3>Optimization Strategies</h3>
      <p>When performance matters, consider these strategies:</p>
      <ol>
        <li><strong>Lazy Evaluation</strong> — Defer computation until the result is actually needed</li>
        <li><strong>Batching</strong> — Group similar operations together for efficiency</li>
        <li><strong>Caching</strong> — Store and reuse expensive computation results</li>
        <li><strong>Streaming</strong> — Process data as it arrives rather than waiting for everything</li>
      </ol>
      <h3>Trade-offs</h3>
      <p>Every advanced technique comes with trade-offs. The art is knowing when to apply which technique:</p>
      <ul>
        <li><strong>Complexity vs. Performance:</strong> More optimized code is often harder to understand</li>
        <li><strong>Memory vs. Speed:</strong> Caching trades memory for faster access</li>
        <li><strong>Flexibility vs. Efficiency:</strong> General solutions handle more cases but may be slower</li>
      </ul>
      <div class="callout warning">
        <strong>Caution:</strong> Don't optimize prematurely. Always measure first, then optimize the bottlenecks.
      </div>
      <h3>Real-World Application</h3>
      <p>In production systems, these advanced concepts are essential for building scalable and maintainable applications. The techniques you learn here will directly impact the quality of your work.</p>
    `;
  }

  // review
  return `
    <div class="lesson-header">
      <span class="lesson-type-badge review">${typeLabel}</span>
      <span class="lesson-difficulty">${lesson.difficulty}</span>
      <span class="lesson-time">${lesson.estimated_minutes} min read</span>
    </div>
    <h2>${lesson.title}</h2>
    <p class="lesson-description">${lesson.description}</p>
    <h3>Summary of Key Points</h3>
    <p>This review consolidates the main takeaways from the preceding lessons. Use this as a reference and a check on your understanding.</p>
    <h3>Key Takeaways</h3>
    <ol>
      <li><strong>Foundation:</strong> The basic concepts provide the building blocks for everything else</li>
      <li><strong>Application:</strong> Knowing the theory is important, but applying it correctly is what matters</li>
      <li><strong>Patterns:</strong> Recognizing common patterns helps you solve new problems faster</li>
      <li><strong>Trade-offs:</strong> Every decision involves trade-offs — understand them before choosing</li>
    </ol>
    <h3>Concept Map</h3>
    <p>Here's how the concepts we've covered relate to each other:</p>
    <ul>
      <li>Concept A feeds into Concept B</li>
      <li>Concept B and Concept C work together</li>
      <li>All three combine in practical applications</li>
    </ul>
    <h3>Common Mistakes to Avoid</h3>
    <ul>
      <li>Confusing Concept A with Concept B — they sound similar but serve different purposes</li>
      <li>Skipping the validation step — always verify your work</li>
      <li>Over-engineering simple solutions — start simple, optimize only when needed</li>
    </ul>
    <div class="tip">
      <strong>Next Steps:</strong> You're now ready to move on to the next milestone. The concepts reviewed here will be built upon in the upcoming lessons.
    </div>
  `;
}

export function getMockLessonContents(
  lessons: StudyPlanLesson[],
  checkpoints: StudyPlanCheckpoint[],
): LessonContent[] {
  const contents: LessonContent[] = [];

  for (const lesson of lessons) {
    contents.push({
      lessonId: lesson.id,
      html: getMockContent(lesson),
    });
  }

  for (const cp of checkpoints) {
    contents.push({
      lessonId: cp.id,
      html: CHECKPOINT_CONTENT[cp.checkpoint_type] ?? CHECKPOINT_CONTENT.self_test,
    });
  }

  return contents;
}

export { getLessonTypeLabel };
