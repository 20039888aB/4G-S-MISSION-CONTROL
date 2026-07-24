import { motion } from 'framer-motion';
import {
  BookOpen,
  Clock,
  Flame,
  GraduationCap,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState, type FormEvent } from 'react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Progress,
  Select,
  StatCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@/components/ui';
import { db } from '@/db/database';
import { clamp, formatDate, uid } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import type { Book, BookStatus, Course, CourseStatus, LearningSession } from '@/types';

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function daysAgoKey(days: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function computeLearningStreak(sessions: LearningSession[]): number {
  const days = new Set(sessions.map((s) => s.date.slice(0, 10)));
  let cursor = todayKey();
  if (!days.has(cursor)) cursor = daysAgoKey(1);
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    if (!days.has(cursor)) break;
    streak += 1;
    const d = new Date(`${cursor}T12:00:00`);
    d.setDate(d.getDate() - 1);
    cursor = d.toISOString().slice(0, 10);
  }
  return streak;
}

const COURSE_STATUS: { value: CourseStatus; label: string }[] = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
];

const BOOK_STATUS: { value: BookStatus; label: string }[] = [
  { value: 'to_read', label: 'Want' },
  { value: 'reading', label: 'Reading' },
  { value: 'finished', label: 'Done' },
  { value: 'abandoned', label: 'Abandoned' },
];

type DeleteTarget =
  | { kind: 'course'; item: Course }
  | { kind: 'book'; item: Book }
  | { kind: 'session'; item: LearningSession };

export default function LearningPage() {
  const addToast = useUiStore((s) => s.addToast);
  const courses = useLiveQuery(() => db.courses.toArray(), []);
  const books = useLiveQuery(() => db.books.toArray(), []);
  const sessions = useLiveQuery(() => db.learningSessions.toArray(), []);

  const [courseModal, setCourseModal] = useState(false);
  const [bookModal, setBookModal] = useState(false);
  const [sessionModal, setSessionModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editingSession, setEditingSession] = useState<LearningSession | null>(null);
  const [toDelete, setToDelete] = useState<DeleteTarget | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const streak = useMemo(
    () => computeLearningStreak(sessions ?? []),
    [sessions],
  );
  const weekHours = useMemo(() => {
    const start = daysAgoKey(6);
    return ((sessions ?? [])
      .filter((s) => s.date >= start)
      .reduce((sum, s) => sum + s.durationMinutes, 0) / 60).toFixed(1);
  }, [sessions]);

  const sortedCourses = useMemo(
    () =>
      [...(courses ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [courses],
  );
  const sortedBooks = useMemo(
    () =>
      [...(books ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [books],
  );
  const sortedSessions = useMemo(
    () =>
      [...(sessions ?? [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40),
    [sessions],
  );

  function closeCourse() {
    setCourseModal(false);
    setEditingCourse(null);
  }
  function closeBook() {
    setBookModal(false);
    setEditingBook(null);
  }
  function closeSession() {
    setSessionModal(false);
    setEditingSession(null);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      switch (toDelete.kind) {
        case 'course':
          await db.courses.delete(toDelete.item.id);
          addToast('success', 'Course removed.');
          break;
        case 'book':
          await db.books.delete(toDelete.item.id);
          addToast('success', 'Book removed.');
          break;
        case 'session':
          await db.learningSessions.delete(toDelete.item.id);
          addToast('success', 'Session removed.');
          break;
      }
      setToDelete(null);
    } catch {
      addToast('danger', 'Could not delete.');
    } finally {
      setDeleting(false);
    }
  }

  const deleteMessage = (() => {
    if (!toDelete) return '';
    switch (toDelete.kind) {
      case 'course':
        return `Permanently remove course “${toDelete.item.title}”?`;
      case 'book':
        return `Permanently remove book “${toDelete.item.title}”?`;
      case 'session':
        return `Permanently remove session “${toDelete.item.topic}”?`;
    }
  })();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Goals"
        title="Learning"
        description="Courses, books, and study sessions that compound mastery."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Learning streak"
          value={`${streak}d`}
          hint="Consecutive days with sessions"
          icon={Flame}
          glass
        />
        <StatCard
          label="Study this week"
          value={`${weekHours}h`}
          hint="Last 7 days"
          icon={Clock}
          accentClassName="bg-goals/15 text-goals"
        />
      </div>

      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="books">Books</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <div className="mb-4 flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setEditingCourse(null);
                setCourseModal(true);
              }}
            >
              <Plus className="size-4" />
              Add course
            </Button>
          </div>
          {sortedCourses.length === 0 ? (
            <Card glass>
              <EmptyState
                icon={GraduationCap}
                title="No courses yet"
                description="Track progress on the skills you're building."
              />
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {sortedCourses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card glass>
                    <CardHeader>
                      <div>
                        <CardTitle className="text-base">{course.title}</CardTitle>
                        <p className="text-xs text-text-muted">
                          {course.provider || 'Self-paced'}
                        </p>
                      </div>
                      <Badge tone="goals">{course.status.replace('_', ' ')}</Badge>
                    </CardHeader>
                    <Progress value={course.progress} showLabel className="mb-3" />
                    <p className="mb-3 text-xs text-text-muted">
                      {course.hoursCompleted}h completed
                      {course.totalHours ? ` / ${course.totalHours}h` : ''}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingCourse(course);
                          setCourseModal(true);
                        }}
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setToDelete({ kind: 'course', item: course })}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="books">
          <div className="mb-4 flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setEditingBook(null);
                setBookModal(true);
              }}
            >
              <Plus className="size-4" />
              Add book
            </Button>
          </div>
          {sortedBooks.length === 0 ? (
            <Card glass>
              <EmptyState
                icon={BookOpen}
                title="No books yet"
                description="Want · Reading · Done — keep your shelf honest."
              />
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {sortedBooks.map((book) => {
                const pagePct =
                  book.totalPages && book.totalPages > 0
                    ? clamp(
                        Math.round((book.currentPage / book.totalPages) * 100),
                        0,
                        100,
                      )
                    : 0;
                return (
                  <Card key={book.id}>
                    <CardHeader>
                      <div>
                        <CardTitle className="text-base">{book.title}</CardTitle>
                        <p className="text-xs text-text-muted">
                          {book.author || 'Unknown author'}
                        </p>
                      </div>
                      <Badge tone="accent">
                        {BOOK_STATUS.find((s) => s.value === book.status)?.label ??
                          book.status}
                      </Badge>
                    </CardHeader>
                    {book.totalPages ? (
                      <Progress value={pagePct} className="mb-2" showLabel />
                    ) : null}
                    <p className="mb-3 text-xs text-text-muted">
                      Page {book.currentPage}
                      {book.totalPages ? ` / ${book.totalPages}` : ''}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingBook(book);
                          setBookModal(true);
                        }}
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setToDelete({ kind: 'book', item: book })}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions">
          <div className="mb-4 flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setEditingSession(null);
                setSessionModal(true);
              }}
            >
              <Plus className="size-4" />
              Log session
            </Button>
          </div>
          {sortedSessions.length === 0 ? (
            <Card glass>
              <EmptyState
                icon={Clock}
                title="No study sessions"
                description="Log hours and subjects to grow your streak."
                action={
                  <Button
                    onClick={() => {
                      setEditingSession(null);
                      setSessionModal(true);
                    }}
                  >
                    <Plus className="size-4" />
                    Log session
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="space-y-2">
              {sortedSessions.map((session) => (
                <Card key={session.id} padding="sm" className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-goals/15 text-goals">
                    <Clock className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{session.topic}</p>
                    <p className="text-xs text-text-muted">
                      {formatDate(session.date)} ·{' '}
                      {(session.durationMinutes / 60).toFixed(1)}h
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Edit session"
                      onClick={() => {
                        setEditingSession(session);
                        setSessionModal(true);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Delete session"
                      onClick={() => setToDelete({ kind: 'session', item: session })}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Modal
        open={courseModal}
        onClose={closeCourse}
        title={editingCourse ? 'Edit course' : 'Add course'}
      >
        <CourseForm
          key={editingCourse?.id ?? 'new-course'}
          initial={editingCourse}
          submitting={busy}
          onCancel={closeCourse}
          onSubmit={async (input) => {
            setBusy(true);
            try {
              const now = new Date().toISOString();
              if (editingCourse) {
                await db.courses.update(editingCourse.id, { ...input, updatedAt: now });
              } else {
                await db.courses.add({
                  id: uid(),
                  ...input,
                  createdAt: now,
                  updatedAt: now,
                });
              }
              addToast('success', editingCourse ? 'Course updated.' : 'Course added.');
              closeCourse();
            } finally {
              setBusy(false);
            }
          }}
        />
      </Modal>

      <Modal
        open={bookModal}
        onClose={closeBook}
        title={editingBook ? 'Edit book' : 'Add book'}
      >
        <BookForm
          key={editingBook?.id ?? 'new-book'}
          initial={editingBook}
          submitting={busy}
          onCancel={closeBook}
          onSubmit={async (input) => {
            setBusy(true);
            try {
              const now = new Date().toISOString();
              if (editingBook) {
                await db.books.update(editingBook.id, { ...input, updatedAt: now });
              } else {
                await db.books.add({
                  id: uid(),
                  ...input,
                  createdAt: now,
                  updatedAt: now,
                });
              }
              addToast('success', editingBook ? 'Book updated.' : 'Book added.');
              closeBook();
            } finally {
              setBusy(false);
            }
          }}
        />
      </Modal>

      <Modal
        open={sessionModal}
        onClose={closeSession}
        title={editingSession ? 'Edit study session' : 'Log study session'}
      >
        <SessionForm
          key={editingSession?.id ?? 'new-session'}
          initial={editingSession}
          submitting={busy}
          onCancel={closeSession}
          onSubmit={async (input) => {
            setBusy(true);
            try {
              if (editingSession) {
                await db.learningSessions.update(editingSession.id, input);
                addToast('success', 'Session updated.');
              } else {
                await db.learningSessions.add({
                  id: uid(),
                  ...input,
                  createdAt: new Date().toISOString(),
                });
                addToast('success', 'Session logged.');
              }
              closeSession();
            } finally {
              setBusy(false);
            }
          }}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete?"
        message={deleteMessage}
        confirming={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function CourseForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial: Course | null;
  submitting: boolean;
  onSubmit: (input: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [provider, setProvider] = useState(initial?.provider ?? '');
  const [status, setStatus] = useState<CourseStatus>(
    initial?.status ?? 'not_started',
  );
  const [progress, setProgress] = useState(String(initial?.progress ?? 0));
  const [totalHours, setTotalHours] = useState(
    initial?.totalHours != null ? String(initial.totalHours) : '',
  );
  const [hoursCompleted, setHoursCompleted] = useState(
    String(initial?.hoursCompleted ?? 0),
  );
  const [url, setUrl] = useState(initial?.url ?? '');
  const [error, setError] = useState<string>();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    await onSubmit({
      title: title.trim(),
      provider: provider.trim() || undefined,
      status,
      progress: clamp(Number(progress) || 0, 0, 100),
      totalHours: totalHours ? Number(totalHours) : undefined,
      hoursCompleted: Number(hoursCompleted) || 0,
      url: url.trim() || undefined,
    });
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} error={error} autoFocus />
      <Input label="Provider" value={provider} onChange={(e) => setProvider(e.target.value)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as CourseStatus)}
          options={COURSE_STATUS}
        />
        <Input
          label="Progress %"
          type="number"
          min={0}
          max={100}
          value={progress}
          onChange={(e) => setProgress(e.target.value)}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Hours completed"
          type="number"
          min={0}
          value={hoursCompleted}
          onChange={(e) => setHoursCompleted(e.target.value)}
        />
        <Input
          label="Total hours"
          type="number"
          min={0}
          value={totalHours}
          onChange={(e) => setTotalHours(e.target.value)}
        />
      </div>
      <Input label="URL" value={url} onChange={(e) => setUrl(e.target.value)} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={submitting}>{initial ? 'Save' : 'Add'}</Button>
      </div>
    </form>
  );
}

function BookForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial: Book | null;
  submitting: boolean;
  onSubmit: (input: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [author, setAuthor] = useState(initial?.author ?? '');
  const [status, setStatus] = useState<BookStatus>(initial?.status ?? 'to_read');
  const [totalPages, setTotalPages] = useState(
    initial?.totalPages != null ? String(initial.totalPages) : '',
  );
  const [currentPage, setCurrentPage] = useState(String(initial?.currentPage ?? 0));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState<string>();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    await onSubmit({
      title: title.trim(),
      author: author.trim() || undefined,
      status,
      totalPages: totalPages ? Number(totalPages) : undefined,
      currentPage: Number(currentPage) || 0,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} error={error} autoFocus />
      <Input label="Author" value={author} onChange={(e) => setAuthor(e.target.value)} />
      <Select
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value as BookStatus)}
        options={BOOK_STATUS}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Current page"
          type="number"
          min={0}
          value={currentPage}
          onChange={(e) => setCurrentPage(e.target.value)}
        />
        <Input
          label="Total pages"
          type="number"
          min={0}
          value={totalPages}
          onChange={(e) => setTotalPages(e.target.value)}
        />
      </div>
      <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={submitting}>{initial ? 'Save' : 'Add'}</Button>
      </div>
    </form>
  );
}

function SessionForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: LearningSession | null;
  submitting: boolean;
  onSubmit: (input: Omit<LearningSession, 'id' | 'createdAt'>) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(initial?.date.slice(0, 10) ?? todayKey());
  const [topic, setTopic] = useState(initial?.topic ?? '');
  const [hours, setHours] = useState(
    initial ? String(initial.durationMinutes / 60) : '1',
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState<string>();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Subject is required');
      return;
    }
    const durationMinutes = Math.round((Number(hours) || 0) * 60);
    if (durationMinutes <= 0) {
      setError('Hours must be greater than 0');
      return;
    }
    await onSubmit({
      date,
      topic: topic.trim(),
      durationMinutes,
      courseId: initial?.courseId,
      bookId: initial?.bookId,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Input
        label="Subject"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        error={error}
        autoFocus
      />
      <Input
        label="Hours"
        type="number"
        min={0.25}
        step={0.25}
        value={hours}
        onChange={(e) => setHours(e.target.value)}
      />
      <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={submitting}>
          {initial ? 'Save' : 'Log'}
        </Button>
      </div>
    </form>
  );
}
