import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import { Layout } from '@/layout';
import { LandingPage } from '@/features/landing';
import { CreatePage } from '@/features/board';
import { RequireAuth } from '@/features/auth';
import { HomePage } from '@/features/home';
import { PublicProfilePage } from '@/features/profile';

function Showcase() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Showcase</h1>
      <p className="text-muted-foreground mt-2">Public gallery of shared boards goes here.</p>
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

function LegacySharedBoard() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/share/${id}`} replace />;
}

function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <p className="text-muted-foreground mt-2">Page not found.</p>
    </div>
  );
}

function NewBoard() {
  return (
    <RequireAuth next="/new">
      <div className="h-svh"><CreatePage /></div>
    </RequireAuth>
  );
}

function Home() {
  return (
    <RequireAuth next="/home">
      <HomePage />
    </RequireAuth>
  );
}

function App() {

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/new" element={<NewBoard />} />
      <Route path="/create" element={<Navigate to="/new" replace />} />
      <Route path="/dashboard" element={<Navigate to="/home" replace />} />
      <Route
        path="*"
        element={
          <Layout>
            <Routes>
              <Route path="/home" element={<Home />} />
              <Route path="/showcase" element={<Showcase />} />
              <Route path="/share/:id" element={<SharedBoard />} />
              <Route path="/b/:id" element={<LegacySharedBoard />} />
              <Route path="/u/:username" element={<PublicProfilePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}

export default App;
