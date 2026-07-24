import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { uid } from '@/lib/utils';
import type {
  Business,
  BusinessIdea,
  BusinessIdeaStatus,
  BusinessProject,
  BusinessStatus,
  Client,
  ProjectStatus,
} from '@/types';

export type BusinessInput = {
  name: string;
  description?: string;
  industry?: string;
  status: BusinessStatus;
  revenueYtd?: number;
  expenseNotes?: string;
  currency?: string;
};

export type ClientInput = {
  businessId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
};

export type ProjectInput = {
  businessId: string;
  clientId?: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  budget?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
};

export type IdeaInput = {
  businessId?: string;
  title: string;
  description?: string;
  status?: BusinessIdeaStatus;
};

export function useBusinessWorkspace() {
  return useLiveQuery(async () => {
    const [businesses, clients, projects, ideas] = await Promise.all([
      db.businesses.toArray(),
      db.clients.toArray(),
      db.businessProjects.toArray(),
      db.businessIdeas.toArray(),
    ]);

    const sortByUpdated = <T extends { updatedAt: string }>(rows: T[]) =>
      [...rows].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return {
      businesses: sortByUpdated(
        businesses.map((b) => ({
          ...b,
          status: b.status ?? ('active' as BusinessStatus),
        })),
      ),
      clients: sortByUpdated(clients),
      projects: sortByUpdated(projects),
      ideas: sortByUpdated(ideas),
    };
  }, []);
}

export async function createBusiness(input: BusinessInput): Promise<string> {
  const now = new Date().toISOString();
  const id = uid();
  const row: Business = {
    id,
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    industry: input.industry?.trim() || undefined,
    status: input.status,
    revenueYtd: input.revenueYtd ?? 0,
    expenseNotes: input.expenseNotes?.trim() || undefined,
    currency: input.currency ?? 'KES',
    createdAt: now,
    updatedAt: now,
  };
  await db.businesses.add(row);
  await db.activityLogs.add({
    id: uid(),
    entity: 'business',
    action: 'created',
    summary: `Created business “${row.name}”`,
    entityId: id,
    createdAt: now,
  });
  return id;
}

export async function updateBusiness(
  id: string,
  input: BusinessInput,
): Promise<void> {
  const now = new Date().toISOString();
  await db.businesses.update(id, {
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    industry: input.industry?.trim() || undefined,
    status: input.status,
    revenueYtd: input.revenueYtd ?? 0,
    expenseNotes: input.expenseNotes?.trim() || undefined,
    currency: input.currency ?? 'KES',
    updatedAt: now,
  });
}

export async function deleteBusiness(id: string): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.businesses,
      db.clients,
      db.businessProjects,
      db.invoices,
      db.businessIdeas,
      db.activityLogs,
    ],
    async () => {
      await db.clients.where('businessId').equals(id).delete();
      await db.businessProjects.where('businessId').equals(id).delete();
      await db.invoices.where('businessId').equals(id).delete();
      await db.businessIdeas.where('businessId').equals(id).modify({
        businessId: undefined,
      });
      await db.businesses.delete(id);
      await db.activityLogs.add({
        id: uid(),
        entity: 'business',
        action: 'deleted',
        summary: 'Deleted a business',
        entityId: id,
        createdAt: new Date().toISOString(),
      });
    },
  );
}

export async function createClient(input: ClientInput): Promise<string> {
  const now = new Date().toISOString();
  const id = uid();
  const row: Client = {
    id,
    businessId: input.businessId,
    name: input.name.trim(),
    email: input.email?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    company: input.company?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  await db.clients.add(row);
  return id;
}

export async function updateClient(
  id: string,
  input: ClientInput,
): Promise<void> {
  const now = new Date().toISOString();
  await db.clients.update(id, {
    businessId: input.businessId,
    name: input.name.trim(),
    email: input.email?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    company: input.company?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    updatedAt: now,
  });
}

export async function deleteClient(id: string): Promise<void> {
  await db.clients.delete(id);
}

export async function createProject(input: ProjectInput): Promise<string> {
  const now = new Date().toISOString();
  const id = uid();
  const row: BusinessProject = {
    id,
    businessId: input.businessId,
    clientId: input.clientId || undefined,
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    status: input.status,
    budget: input.budget,
    currency: input.currency ?? 'KES',
    startDate: input.startDate || undefined,
    endDate: input.endDate || undefined,
    createdAt: now,
    updatedAt: now,
  };
  await db.businessProjects.add(row);
  return id;
}

export async function updateProject(
  id: string,
  input: ProjectInput,
): Promise<void> {
  const now = new Date().toISOString();
  await db.businessProjects.update(id, {
    businessId: input.businessId,
    clientId: input.clientId || undefined,
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    status: input.status,
    budget: input.budget,
    currency: input.currency ?? 'KES',
    startDate: input.startDate || undefined,
    endDate: input.endDate || undefined,
    updatedAt: now,
  });
}

export async function deleteProject(id: string): Promise<void> {
  await db.businessProjects.delete(id);
}

export async function createIdea(input: IdeaInput): Promise<string> {
  const now = new Date().toISOString();
  const id = uid();
  const row: BusinessIdea = {
    id,
    businessId: input.businessId || undefined,
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    status: input.status ?? 'inbox',
    createdAt: now,
    updatedAt: now,
  };
  await db.businessIdeas.add(row);
  return id;
}

export async function updateIdea(id: string, input: IdeaInput): Promise<void> {
  const now = new Date().toISOString();
  await db.businessIdeas.update(id, {
    businessId: input.businessId || undefined,
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    status: input.status ?? 'inbox',
    updatedAt: now,
  });
}

export async function deleteIdea(id: string): Promise<void> {
  await db.businessIdeas.delete(id);
}
