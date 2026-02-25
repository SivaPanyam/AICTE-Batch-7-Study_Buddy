# Study Buddy

An AI-powered study planner and companion application built with React, Tailwind CSS, and Google Gemini.

## Features

- **Goal Planner**: Create structured study plans with AI.
- **Streak Tracking**: Track your daily study habits.
- **Daily Quiz**: Test your knowledge based on your study topics.
- **Document Q&A**: Chat with your PDF study materials.
- **Schedule**: Visual timeline of your study tasks.
- **Course Recommendations**: Get curated learning resources.

## Setup & Running

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Setup**
    - Create a `.env` file in the root directory.
    - Copy the contents of `.env.example` into `.env`.
    - Add your Google Gemini API Key:
      ```
      VITE_GEMINI_API_KEY=your_actual_api_key_here
      ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

4.  **Build for Production**
    ```bash
    npm run build
    ```
