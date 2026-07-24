import { motion } from 'framer-motion';
import {
  Briefcase,
  Lightbulb,
  Pencil,
  Plus,
  Trash2,
  Users,
  FolderKanban,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@/components/ui';
import {
  createBusiness,
  createClient,
  createIdea,
  createProject,
  deleteBusiness,
  deleteClient,
  deleteIdea,
  deleteProject,
  updateBusiness,
  updateClient,
  updateIdea,
  updateProject,
  useBusinessWorkspace,
  type BusinessInput,
  type ClientInput,
  type IdeaInput,
  type ProjectInput,
} from '@/features/business/hooks';
import { cn, formatCurrency } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUiStore } from '@/stores/uiStore';
import type {
  Business,
  BusinessIdea,
  BusinessIdeaStatus,
  BusinessProject,
  BusinessStatus,
  Client,
  ProjectStatus,
} from '@/types';

const BUSINESS_STATUS: { value: BusinessStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'closed', label: 'Closed' },
];

const PROJECT_STATUS: { value: ProjectStatus; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const IDEA_STATUS: { value: BusinessIdeaStatus; label: string }[] = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'exploring', label: 'Exploring' },
  { value: 'parked', label: 'Parked' },
  { value: 'converted', label: 'Converted' },
];

function statusTone(
  status: string,
): 'accent' | 'success' | 'warning' | 'neutral' | 'danger' {
  if (status === 'active' || status === 'completed' || status === 'converted')
    return 'success';
  if (status === 'paused' || status === 'on_hold' || status === 'parked')
    return 'warning';
  if (status === 'closed' || status === 'cancelled') return 'danger';
  if (status === 'new' || status === 'inbox' || status === 'planned')
    return 'accent';
  return 'neutral';
}

type ModalKind = 'business' | 'client' | 'project' | 'idea' | null;

export default function BusinessPage() {
  const data = useBusinessWorkspace();
  const currency = useSettingsStore((s) => s.currency);
  const addToast = useUiStore((s) => s.addToast);

  const [modal, setModal] = useState<ModalKind>(null);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingProject, setEditingProject] = useState<BusinessProject | null>(
    null,
  );
  const [editingIdea, setEditingIdea] = useState<BusinessIdea | null>(null);
  const [busy, setBusy] = useState(false);

  const businessOptions = useMemo(
    () =>
      (data?.businesses ?? []).map((b) => ({
        value: b.id,
        label: b.name,
      })),
    [data?.businesses],
  );

  const clientOptions = useMemo(
    () =>
      (data?.clients ?? []).map((c) => ({
        value: c.id,
        label: c.name,
      })),
    [data?.clients],
  );

  function openCreate(kind: Exclude<ModalKind, null>) {
    setEditingBusiness(null);
    setEditingClient(null);
    setEditingProject(null);
    setEditingIdea(null);
    setModal(kind);
  }

  function closeModal() {
    setModal(null);
    setEditingBusiness(null);
    setEditingClient(null);
    setEditingProject(null);
    setEditingIdea(null);
  }

  async function onSaveBusiness(input: BusinessInput) {
    setBusy(true);
    try {
      if (editingBusiness) {
        await updateBusiness(editingBusiness.id, input);
        addToast('success', 'Business updated.');
      } else {
        await createBusiness(input);
        addToast('success', 'Business created.');
      }
      closeModal();
    } catch {
      addToast('danger', 'Could not save business.');
    } finally {
      setBusy(false);
    }
  }

  async function onSaveClient(input: ClientInput) {
    setBusy(true);
    try {
      if (editingClient) {
        await updateClient(editingClient.id, input);
        addToast('success', 'Client updated.');
      } else {
        await createClient(input);
        addToast('success', 'Client added.');
      }
      closeModal();
    } catch {
      addToast('danger', 'Could not save client.');
    } finally {
      setBusy(false);
    }
  }

  async function onSaveProject(input: ProjectInput) {
    setBusy(true);
    try {
      if (editingProject) {
        await updateProject(editingProject.id, input);
        addToast('success', 'Project updated.');
      } else {
        await createProject(input);
        addToast('success', 'Project created.');
      }
      closeModal();
    } catch {
      addToast('danger', 'Could not save project.');
    } finally {
      setBusy(false);
    }
  }

  async function onSaveIdea(input: IdeaInput) {
    setBusy(true);
    try {
      if (editingIdea) {
        await updateIdea(editingIdea.id, input);
        addToast('success', 'Idea updated.');
      } else {
        await createIdea(input);
        addToast('success', 'Idea captured.');
      }
      closeModal();
    } catch {
      addToast('danger', 'Could not save idea.');
    } finally {
      setBusy(false);
    }
  }

  const businesses = data?.businesses ?? [];
  const clients = data?.clients ?? [];
  const projects = data?.projects ?? [];
  const ideas = data?.ideas ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Goals"
        title="Business"
        description="Clients, projects, and ideas in one premium cockpit."
        actions={
          <Button onClick={() => openCreate('business')}>
            <Plus className="size-4" />
            Add business
          </Button>
        }
      />

      <Tabs defaultValue="businesses">
        <TabsList className="flex-wrap">
          <TabsTrigger value="businesses">Businesses</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="ideas">Ideas</TabsTrigger>
        </TabsList>

        <TabsContent value="businesses">
          {businesses.length === 0 ? (
            <Card glass>
              <EmptyState
                icon={Briefcase}
                title="No businesses yet"
                description="Register your first venture and start tracking clients and projects."
                action={
                  <Button onClick={() => openCreate('business')}>
                    <Plus className="size-4" />
                    Add business
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {businesses.map((biz, i) => (
                <motion.div
                  key={biz.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card glass className="h-full">
                    <CardHeader>
                      <div>
                        <CardTitle>{biz.name}</CardTitle>
                        <p className="mt-1 text-sm text-text-muted">
                          {biz.industry || 'General'}
                        </p>
                      </div>
                      <Badge tone={statusTone(biz.status)}>{biz.status}</Badge>
                    </CardHeader>
                    {biz.description ? (
                      <p className="mb-3 text-sm text-text-muted line-clamp-2">
                        {biz.description}
                      </p>
                    ) : null}
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      <div className="rounded-[var(--radius-md)] border border-border bg-bg/40 p-3">
                        <p className="text-xs text-text-muted">Revenue YTD</p>
                        <p className="mt-1 font-display text-lg font-semibold text-accent">
                          {formatCurrency(biz.revenueYtd, biz.currency || currency)}
                        </p>
                      </div>
                      <div className="rounded-[var(--radius-md)] border border-border bg-bg/40 p-3">
                        <p className="text-xs text-text-muted">Linked</p>
                        <p className="mt-1 text-sm font-medium">
                          {clients.filter((c) => c.businessId === biz.id).length}{' '}
                          clients ·{' '}
                          {projects.filter((p) => p.businessId === biz.id).length}{' '}
                          projects
                        </p>
                      </div>
                    </div>
                    {biz.expenseNotes ? (
                      <p className="mb-3 text-xs text-text-muted">
                        Notes: {biz.expenseNotes}
                      </p>
                    ) : (
                      <p className="mb-3 text-xs text-text-muted">
                        Track detailed cashflow in{' '}
                        <Link to="/finance" className="text-accent hover:underline">
                          Finance
                        </Link>
                        .
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingBusiness(biz);
                          setModal('business');
                        }}
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          await deleteBusiness(biz.id);
                          addToast('success', 'Business removed.');
                        }}
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

        <TabsContent value="clients">
          <div className="mb-4 flex justify-end">
            <Button
              size="sm"
              disabled={businesses.length === 0}
              onClick={() => openCreate('client')}
            >
              <Plus className="size-4" />
              Add client
            </Button>
          </div>
          {clients.length === 0 ? (
            <Card glass>
              <EmptyState
                icon={Users}
                title="No clients yet"
                description="Link clients to a business to keep your pipeline clear."
                action={
                  businesses.length > 0 ? (
                    <Button onClick={() => openCreate('client')}>
                      <Plus className="size-4" />
                      Add client
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {clients.map((client) => {
                const biz = businesses.find((b) => b.id === client.businessId);
                return (
                  <Card key={client.id} className="h-full">
                    <CardHeader>
                      <div>
                        <CardTitle className="text-base">{client.name}</CardTitle>
                        <p className="text-xs text-text-muted">
                          {biz?.name ?? 'Unlinked'} · {client.company || '—'}
                        </p>
                      </div>
                    </CardHeader>
                    <div className="space-y-1 text-sm text-text-muted">
                      {client.email ? <p>{client.email}</p> : null}
                      {client.phone ? <p>{client.phone}</p> : null}
                      {client.notes ? (
                        <p className="line-clamp-2">{client.notes}</p>
                      ) : null}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingClient(client);
                          setModal('client');
                        }}
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          await deleteClient(client.id);
                          addToast('success', 'Client removed.');
                        }}
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

        <TabsContent value="projects">
          <div className="mb-4 flex justify-end">
            <Button
              size="sm"
              disabled={businesses.length === 0}
              onClick={() => openCreate('project')}
            >
              <Plus className="size-4" />
              Add project
            </Button>
          </div>
          {projects.length === 0 ? (
            <Card glass>
              <EmptyState
                icon={FolderKanban}
                title="No projects yet"
                description="Ship work in scoped projects tied to businesses and clients."
              />
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {projects.map((project) => {
                const biz = businesses.find((b) => b.id === project.businessId);
                const client = clients.find((c) => c.id === project.clientId);
                return (
                  <Card key={project.id} glass>
                    <CardHeader>
                      <div>
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        <p className="text-xs text-text-muted">
                          {biz?.name ?? '—'}
                          {client ? ` · ${client.name}` : ''}
                        </p>
                      </div>
                      <Badge tone={statusTone(project.status)}>
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </CardHeader>
                    {project.description ? (
                      <p className="mb-2 text-sm text-text-muted line-clamp-2">
                        {project.description}
                      </p>
                    ) : null}
                    {typeof project.budget === 'number' ? (
                      <p className="mb-3 text-sm font-medium text-accent">
                        Budget{' '}
                        {formatCurrency(
                          project.budget,
                          project.currency || currency,
                        )}
                      </p>
                    ) : null}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingProject(project);
                          setModal('project');
                        }}
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          await deleteProject(project.id);
                          addToast('success', 'Project removed.');
                        }}
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

        <TabsContent value="ideas">
          <div className="mb-4 flex justify-end">
            <Button size="sm" onClick={() => openCreate('idea')}>
              <Plus className="size-4" />
              Capture idea
            </Button>
          </div>
          {ideas.length === 0 ? (
            <Card glass>
              <EmptyState
                icon={Lightbulb}
                title="Ideas inbox is empty"
                description="Park sparks here before they become businesses or projects."
                action={
                  <Button onClick={() => openCreate('idea')}>
                    <Plus className="size-4" />
                    Capture idea
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {ideas.map((idea) => (
                <Card key={idea.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{idea.title}</CardTitle>
                    <Badge tone={statusTone(idea.status)}>{idea.status}</Badge>
                  </CardHeader>
                  {idea.description ? (
                    <p className="mb-3 text-sm text-text-muted line-clamp-3">
                      {idea.description}
                    </p>
                  ) : null}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingIdea(idea);
                        setModal('idea');
                      }}
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await deleteIdea(idea.id);
                        addToast('success', 'Idea removed.');
                      }}
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
        open={modal === 'business'}
        onClose={closeModal}
        title={editingBusiness ? 'Edit business' : 'New business'}
        size="lg"
      >
        <BusinessForm
          initial={editingBusiness}
          currency={currency}
          submitting={busy}
          onCancel={closeModal}
          onSubmit={onSaveBusiness}
        />
      </Modal>

      <Modal
        open={modal === 'client'}
        onClose={closeModal}
        title={editingClient ? 'Edit client' : 'New client'}
      >
        <ClientForm
          initial={editingClient}
          businesses={businessOptions}
          submitting={busy}
          onCancel={closeModal}
          onSubmit={onSaveClient}
        />
      </Modal>

      <Modal
        open={modal === 'project'}
        onClose={closeModal}
        title={editingProject ? 'Edit project' : 'New project'}
        size="lg"
      >
        <ProjectForm
          initial={editingProject}
          businesses={businessOptions}
          clients={clientOptions}
          currency={currency}
          submitting={busy}
          onCancel={closeModal}
          onSubmit={onSaveProject}
        />
      </Modal>

      <Modal
        open={modal === 'idea'}
        onClose={closeModal}
        title={editingIdea ? 'Edit idea' : 'Capture idea'}
      >
        <IdeaForm
          initial={editingIdea}
          businesses={businessOptions}
          submitting={busy}
          onCancel={closeModal}
          onSubmit={onSaveIdea}
        />
      </Modal>
    </div>
  );
}

function BusinessForm({
  initial,
  currency,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial: Business | null;
  currency: string;
  submitting: boolean;
  onSubmit: (input: BusinessInput) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [industry, setIndustry] = useState(initial?.industry ?? '');
  const [status, setStatus] = useState<BusinessStatus>(
    initial?.status ?? 'new',
  );
  const [revenueYtd, setRevenueYtd] = useState(
    String(initial?.revenueYtd ?? 0),
  );
  const [expenseNotes, setExpenseNotes] = useState(initial?.expenseNotes ?? '');
  const [error, setError] = useState<string>();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    await onSubmit({
      name,
      description,
      industry,
      status,
      revenueYtd: Number(revenueYtd) || 0,
      expenseNotes,
      currency,
    });
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={error}
        autoFocus
      />
      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as BusinessStatus)}
          options={BUSINESS_STATUS}
        />
      </div>
      <Input
        label="Revenue YTD"
        type="number"
        min={0}
        value={revenueYtd}
        onChange={(e) => setRevenueYtd(e.target.value)}
      />
      <Textarea
        label="Revenue / expense notes"
        value={expenseNotes}
        onChange={(e) => setExpenseNotes(e.target.value)}
        rows={2}
        placeholder="Quick notes — detailed ledger lives in Finance"
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? 'Save' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

function ClientForm({
  initial,
  businesses,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial: Client | null;
  businesses: { value: string; label: string }[];
  submitting: boolean;
  onSubmit: (input: ClientInput) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [businessId, setBusinessId] = useState(
    initial?.businessId ?? businesses[0]?.value ?? '',
  );
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [company, setCompany] = useState(initial?.company ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState<string>();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !businessId) {
      setError('Name and business are required');
      return;
    }
    await onSubmit({ businessId, name, email, phone, company, notes });
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Select
        label="Business"
        value={businessId}
        onChange={(e) => setBusinessId(e.target.value)}
        options={businesses}
        error={error && !businessId ? error : undefined}
      />
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={error && !name.trim() ? error : undefined}
        autoFocus
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <Input
        label="Company"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
      />
      <Textarea
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? 'Save' : 'Add'}
        </Button>
      </div>
    </form>
  );
}

function ProjectForm({
  initial,
  businesses,
  clients,
  currency,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial: BusinessProject | null;
  businesses: { value: string; label: string }[];
  clients: { value: string; label: string }[];
  currency: string;
  submitting: boolean;
  onSubmit: (input: ProjectInput) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [businessId, setBusinessId] = useState(
    initial?.businessId ?? businesses[0]?.value ?? '',
  );
  const [clientId, setClientId] = useState(initial?.clientId ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [status, setStatus] = useState<ProjectStatus>(
    initial?.status ?? 'planned',
  );
  const [budget, setBudget] = useState(
    initial?.budget != null ? String(initial.budget) : '',
  );
  const [error, setError] = useState<string>();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !businessId) {
      setError('Name and business are required');
      return;
    }
    await onSubmit({
      businessId,
      clientId: clientId || undefined,
      name,
      description,
      status,
      budget: budget ? Number(budget) : undefined,
      currency,
    });
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={error}
        autoFocus
      />
      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Business"
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          options={businesses}
        />
        <Select
          label="Client"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          options={[{ value: '', label: 'None' }, ...clients]}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          options={PROJECT_STATUS}
        />
        <Input
          label="Budget"
          type="number"
          min={0}
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? 'Save' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

function IdeaForm({
  initial,
  businesses,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial: BusinessIdea | null;
  businesses: { value: string; label: string }[];
  submitting: boolean;
  onSubmit: (input: IdeaInput) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [businessId, setBusinessId] = useState(initial?.businessId ?? '');
  const [status, setStatus] = useState<BusinessIdeaStatus>(
    initial?.status ?? 'inbox',
  );
  const [error, setError] = useState<string>();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    await onSubmit({
      title,
      description,
      businessId: businessId || undefined,
      status,
    });
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={error}
        autoFocus
      />
      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Link business"
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          options={[{ value: '', label: 'Unlinked' }, ...businesses]}
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as BusinessIdeaStatus)}
          options={IDEA_STATUS}
        />
      </div>
      <div className={cn('flex justify-end gap-2 pt-2')}>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? 'Save' : 'Capture'}
        </Button>
      </div>
    </form>
  );
}
