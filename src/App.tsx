import { Routes, Route, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { LandingPage } from '@/app/LandingPage';
import { CreatePage } from '@/app/CreatePage';
import { TestPage } from '@/app/TestPage';

function Share() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Share</h1>
      <p className="text-muted-foreground mt-2">Shared boards go here.</p>
    </div>
  );
}

function SharedBoard() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Shared board</h1>
      <p className="text-muted-foreground mt-2 font-mono">{id}</p>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <p className="text-muted-foreground mt-2">Page not found.</p>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/create" element={<div className="h-svh"><CreatePage /></div>} />
      <Route
        path="*"
        element={
          <Layout>
            <Routes>
              <Route path="/test" element={<TestPage />} />
              <Route path="/share" element={<Share />} />
              <Route path="/share/:id" element={<SharedBoard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}

export default App;
