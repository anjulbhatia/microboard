import { Routes, Route, useParams } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { SparklesIcon } from '@hugeicons/core-free-icons';
import { Layout } from '@/components/Layout';

function Home() {
  return (
    <div className="min-h-[calc(100svh-8rem)] flex flex-col items-center justify-center p-8 text-center">
      <HugeiconsIcon icon={SparklesIcon} size={40} strokeWidth={1.5} className="text-primary mb-4" />
      <h1 className="text-4xl font-bold tracking-tight">Microboard</h1>
      <p className="text-muted-foreground mt-2 max-w-md">
        Boilerplate ready. React 19 + Vite + Tailwind v4 + shadcn theme + next-themes + Hugeicons.
      </p>
    </div>
  );
}

function Create() {
  return (
    <div className="min-h-[calc(100svh-8rem)] flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Create</h1>
      <p className="text-muted-foreground mt-2">Board editor goes here.</p>
    </div>
  );
}

function Share() {
  return (
    <div className="min-h-[calc(100svh-8rem)] flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Share</h1>
      <p className="text-muted-foreground mt-2">Shared boards go here.</p>
    </div>
  );
}

function SharedBoard() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="min-h-[calc(100svh-8rem)] flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Shared board</h1>
      <p className="text-muted-foreground mt-2 font-mono">{id}</p>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-[calc(100svh-8rem)] flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <p className="text-muted-foreground mt-2">Page not found.</p>
    </div>
  );
}

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<Create />} />
        <Route path="/share" element={<Share />} />
        <Route path="/share/:id" element={<SharedBoard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default App;
