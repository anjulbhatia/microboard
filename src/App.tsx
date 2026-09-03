import { Routes, Route, Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { SparklesIcon, DashboardSquare01Icon } from '@hugeicons/core-free-icons';
import { DitherButton } from '@/components/dither-kit/button';
import { Layout } from '@/components/Layout';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const, delay: i * 0.1 },
  }),
};

function Home() {
  return (
    <div className="h-full grid items-center gap-8 px-6 md:grid-cols-2 md:gap-12 md:px-12">
      <div className="text-center md:text-left">
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs text-muted-foreground">
            <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={1.5} />
            data-to-dashboard workspace
          </span>
        </motion.div>
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
          className="mt-4 text-5xl font-bold tracking-tight md:text-6xl"
        >
          Clean data.
          <br />
          Craft microcharts.
          <br />
          <span className="text-primary">Ship dashboards.</span>
        </motion.h1>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
          className="mx-auto mt-4 max-w-md text-muted-foreground md:mx-0"
        >
          Microboard is a collaborative workspace where you and your agent build
          beautiful microchart dashboards together on the same live canvas.
        </motion.p>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={3}
          className="mt-6 flex items-center justify-center gap-3 md:justify-start"
        >
          <Link to="/create">
            <DitherButton color="purple" variant="gradient" className="px-6 py-3 text-sm">
              Start creating
            </DitherButton>
          </Link>
          <Link to="/share">
            <DitherButton color="grey" variant="solid" className="px-6 py-3 text-sm">
              View shared
            </DitherButton>
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
        className="mx-auto w-full max-w-xl"
      >
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card p-8 text-center">
          <HugeiconsIcon icon={DashboardSquare01Icon} size={40} strokeWidth={1.5} className="text-muted-foreground" />
          <p className="font-mono text-sm text-muted-foreground">interface preview</p>
          <p className="text-xs text-muted-foreground">board canvas demo lands here</p>
        </div>
      </motion.div>
    </div>
  );
}

function Create() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Create</h1>
      <p className="text-muted-foreground mt-2">Board editor goes here.</p>
    </div>
  );
}

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
