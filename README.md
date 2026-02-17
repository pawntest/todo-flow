# Todo-Flow 📝

A modern, Google Todo-inspired task management application built with React and Express.

![Todo-Flow](https://img.shields.io/badge/Status-Production-green)
![React](https://img.shields.io/badge/React-18.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)

## Features ✨

### Core Functionality
- **Multiple Lists** - Organize tasks into separate lists (Work, Personal, etc.)
- **Task Management** - Create, complete, edit, and delete tasks
- **Subtasks** - Nested tasks up to 3 levels deep for complex projects
- **Due Dates** - Set and track task deadlines with smart date formatting
- **Notes** - Add detailed descriptions to any task
- **Task Details** - Dedicated panel for viewing and editing task information

### UX Features
- **Smart Date Display** - Shows "Today", "Tomorrow", "Overdue", or formatted dates
- **Visual Feedback** - Color-coded due dates (red for overdue, blue for today)
- **Empty States** - Helpful prompts when lists or tasks are empty
- **Loading Skeletons** - Smooth loading experience
- **Responsive Design** - Works on desktop and mobile devices

## Tech Stack 🛠️

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Client state management
- **React Query** - Server state and caching
- **date-fns** - Date manipulation
- **Axios** - HTTP client

### Backend
- **Express** - Web framework
- **Prisma** - Type-safe ORM
- **SQLite** - Database
- **TypeScript** - Type safety
- **Zod** - Request validation

### Architecture
- **Monorepo** - Workspaces for client, server, and shared code
- **REST API** - Clean API design with proper status codes
- **Service Layer** - Business logic separation
- **Optimistic Updates** - Instant UI feedback

## Getting Started 🚀

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Initialize database**
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Seed database (optional)**
   ```bash
   npx tsx server/src/seed.ts
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

   This starts both:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

### Individual Commands

```bash
# Start frontend only
npm run dev:client

# Start backend only
npm run dev:server

# Build for production
npm run build

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Project Structure 📁

```
todo-flow/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── layout/   # Layout components
│   │   │   ├── lists/    # List components
│   │   │   ├── tasks/    # Task components
│   │   │   └── ui/       # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── stores/       # Zustand state stores
│   │   ├── services/     # API client
│   │   └── utils/        # Utility functions
│   └── package.json
│
├── server/                # Express backend
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Express middleware
│   │   └── prisma/       # Database schema
│   └── package.json
│
├── shared/                # Shared TypeScript types
│   └── src/
│       └── types.ts
│
└── package.json           # Root workspace config
```

## API Endpoints 🔌

### Lists
- `GET /api/lists` - Get all lists
- `POST /api/lists` - Create a list
- `PATCH /api/lists/:id` - Update a list
- `DELETE /api/lists/:id` - Delete a list

### Tasks
- `GET /api/tasks/list/:listId` - Get all tasks for a list
- `GET /api/tasks/:id` - Get a single task
- `POST /api/tasks` - Create a task
- `PATCH /api/tasks/:id` - Update a task
- `PATCH /api/tasks/:id/complete` - Toggle task completion
- `DELETE /api/tasks/:id` - Delete a task

## Database Schema 💾

```prisma
model List {
  id        String   @id @default(uuid())
  name      String
  color     String?
  order     Int
  tasks     Task[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Task {
  id          String    @id @default(uuid())
  title       String
  notes       String?
  completed   Boolean   @default(false)
  dueDate     DateTime?
  order       Int
  
  // Relationships
  listId      String
  list        List      @relation(...)
  
  // Self-referential for subtasks
  parentId    String?
  parent      Task?     @relation("TaskSubtasks", ...)
  subtasks    Task[]    @relation("TaskSubtasks")
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  completedAt DateTime?
}
```

## Development 💻

### Key Files
- `server/prisma/schema.prisma` - Database schema
- `server/src/services/taskService.ts` - Task business logic
- `client/src/components/tasks/TaskItem.tsx` - Recursive task component
- `client/src/hooks/useTasksQuery.ts` - React Query hooks
- `client/src/stores/uiStore.ts` - UI state management

### Adding New Features

1. **Add database field**: Update `schema.prisma` and run migration
2. **Update backend**: Add logic to service layer, update controllers
3. **Update frontend**: Create/update components, add hooks if needed
4. **Update types**: Add shared types in `shared/src/types.ts`

## Future Enhancements 🎯

- [ ] Authentication and user accounts
- [ ] Real-time collaboration
- [ ] Tags and labels
- [ ] Search and filters
- [ ] Drag-and-drop reordering
- [ ] Recurring tasks
- [ ] Task attachments
- [ ] Mobile app (React Native)
- [ ] Dark mode
- [ ] Keyboard shortcuts

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License 📄

MIT License - feel free to use this project for learning or personal use.

## Support 💬

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using React, Express, and Prisma
