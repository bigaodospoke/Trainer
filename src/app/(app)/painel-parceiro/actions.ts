'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPartnerAccess, getHighestPartnerTier, type PartnerTierValue } from '@/lib/partners/constants';
import { generateUniquePartnerSlug } from '@/lib/partners/queries';
import { toId } from '@/lib/team-builder/showdown-format';

async function requirePartnerUser() {
  const session = await auth();
  if (!session?.user) redirect('/signin');
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, tags: true } });
  if (!user || !hasPartnerAccess(user.tags)) throw new Error('Acesso restrito a parceiros.');
  return user;
}

async function requireOwnServer(userId: string) {
  const server = await prisma.partnerServer.findUnique({ where: { ownerId: userId } });
  if (!server) throw new Error('Servidor não encontrado — crie seu servidor primeiro.');
  return server;
}

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
}

export async function createPartnerServer(formData: FormData) {
  const user = await requirePartnerUser();
  const existing = await prisma.partnerServer.findUnique({ where: { ownerId: user.id } });
  if (existing) return;

  const name = str(formData, 'name');
  if (!name) throw new Error('Nome é obrigatório.');
  const description = str(formData, 'description') ?? '';

  const slug = await generateUniquePartnerSlug(name);
  const tier: PartnerTierValue = getHighestPartnerTier(user.tags) ?? 'PARCEIRO';

  await prisma.partnerServer.create({
    data: { ownerId: user.id, slug, name, description: description.slice(0, 600), tier, status: 'PENDING' },
  });

  revalidatePath('/painel-parceiro');
}

export async function updateServerInfo(formData: FormData) {
  const user = await requirePartnerUser();
  const server = await requireOwnServer(user.id);

  const name = str(formData, 'name');
  if (!name) throw new Error('Nome é obrigatório.');

  await prisma.partnerServer.update({
    where: { id: server.id },
    data: {
      name,
      description: (str(formData, 'description') ?? '').slice(0, 600),
      logoUrl: str(formData, 'logoUrl'),
      bannerUrl: str(formData, 'bannerUrl'),
      serverIp: str(formData, 'serverIp'),
      minecraftVersion: str(formData, 'minecraftVersion'),
      modpack: str(formData, 'modpack'),
      region: str(formData, 'region'),
      serverStatus: (str(formData, 'serverStatus') as never) ?? 'ONLINE',
      categories: formData.getAll('categories') as never,
    },
  });

  revalidatePath('/painel-parceiro');
  revalidatePath(`/partners/${server.slug}`);
}

export async function updateServerLinks(formData: FormData) {
  const user = await requirePartnerUser();
  const server = await requireOwnServer(user.id);

  await prisma.partnerServer.update({
    where: { id: server.id },
    data: {
      discordUrl: str(formData, 'discordUrl'),
      websiteUrl: str(formData, 'websiteUrl'),
      storeUrl: str(formData, 'storeUrl'),
      instagramUrl: str(formData, 'instagramUrl'),
      youtubeUrl: str(formData, 'youtubeUrl'),
      tiktokUrl: str(formData, 'tiktokUrl'),
    },
  });

  revalidatePath('/painel-parceiro');
  revalidatePath(`/partners/${server.slug}`);
}

export async function addGalleryImage(formData: FormData) {
  const user = await requirePartnerUser();
  const server = await requireOwnServer(user.id);

  const imageUrl = str(formData, 'imageUrl');
  if (!imageUrl) throw new Error('URL da imagem é obrigatória.');

  const count = await prisma.partnerGalleryImage.count({ where: { partnerId: server.id } });
  await prisma.partnerGalleryImage.create({
    data: { partnerId: server.id, imageUrl, caption: str(formData, 'caption'), position: count },
  });

  revalidatePath('/painel-parceiro');
  revalidatePath(`/partners/${server.slug}`);
}

export async function removeGalleryImage(imageId: string) {
  const user = await requirePartnerUser();
  const server = await requireOwnServer(user.id);
  await prisma.partnerGalleryImage.deleteMany({ where: { id: imageId, partnerId: server.id } });
  revalidatePath('/painel-parceiro');
  revalidatePath(`/partners/${server.slug}`);
}

export async function createEvent(formData: FormData) {
  const user = await requirePartnerUser();
  const server = await requireOwnServer(user.id);

  const title = str(formData, 'title');
  const dateStr = str(formData, 'eventDate');
  const timeStr = str(formData, 'eventTime') ?? '00:00';
  if (!title || !dateStr) throw new Error('Título e data são obrigatórios.');

  await prisma.partnerEvent.create({
    data: {
      partnerId: server.id,
      title,
      description: (str(formData, 'description') ?? '').slice(0, 1000),
      eventDate: new Date(`${dateStr}T${timeStr}:00`),
      coverImageUrl: str(formData, 'coverImageUrl'),
      link: str(formData, 'link'),
    },
  });

  revalidatePath('/painel-parceiro');
  revalidatePath(`/partners/${server.slug}`);
}

export async function deleteEvent(eventId: string) {
  const user = await requirePartnerUser();
  const server = await requireOwnServer(user.id);
  await prisma.partnerEvent.deleteMany({ where: { id: eventId, partnerId: server.id } });
  revalidatePath('/painel-parceiro');
  revalidatePath(`/partners/${server.slug}`);
}

export async function createNews(formData: FormData) {
  const user = await requirePartnerUser();
  const server = await requireOwnServer(user.id);

  const title = str(formData, 'title');
  const content = str(formData, 'content');
  if (!title || !content) throw new Error('Título e conteúdo são obrigatórios.');

  await prisma.partnerNews.create({
    data: {
      partnerId: server.id,
      title,
      content: content.slice(0, 5000),
      coverImageUrl: str(formData, 'coverImageUrl'),
    },
  });

  revalidatePath('/painel-parceiro');
  revalidatePath(`/partners/${server.slug}`);
}

export async function deleteNews(newsId: string) {
  const user = await requirePartnerUser();
  const server = await requireOwnServer(user.id);
  await prisma.partnerNews.deleteMany({ where: { id: newsId, partnerId: server.id } });
  revalidatePath('/painel-parceiro');
  revalidatePath(`/partners/${server.slug}`);
}

export async function addTierEntry(formData: FormData) {
  const user = await requirePartnerUser();
  const server = await requireOwnServer(user.id);

  const speciesName = str(formData, 'speciesName');
  const rank = str(formData, 'rank');
  if (!speciesName || !rank) throw new Error('Espécie e tier são obrigatórios.');

  const species = await prisma.pokemonSpecies.findUnique({ where: { showdownId: toId(speciesName) } });
  if (!species) throw new Error(`"${speciesName}" não encontrado na Pokédex.`);

  await prisma.partnerTierEntry.upsert({
    where: { partnerId_speciesId: { partnerId: server.id, speciesId: species.id } },
    create: { partnerId: server.id, speciesId: species.id, rank: rank as never },
    update: { rank: rank as never },
  });

  revalidatePath('/painel-parceiro');
  revalidatePath(`/partners/${server.slug}`);
}

export async function removeTierEntry(entryId: string) {
  const user = await requirePartnerUser();
  const server = await requireOwnServer(user.id);
  await prisma.partnerTierEntry.deleteMany({ where: { id: entryId, partnerId: server.id } });
  revalidatePath('/painel-parceiro');
  revalidatePath(`/partners/${server.slug}`);
}

export async function addBanEntry(formData: FormData) {
  const user = await requirePartnerUser();
  const server = await requireOwnServer(user.id);

  const speciesName = str(formData, 'speciesName');
  if (!speciesName) throw new Error('Espécie é obrigatória.');

  const species = await prisma.pokemonSpecies.findUnique({ where: { showdownId: toId(speciesName) } });
  if (!species) throw new Error(`"${speciesName}" não encontrado na Pokédex.`);

  await prisma.partnerBanEntry.upsert({
    where: { partnerId_speciesId: { partnerId: server.id, speciesId: species.id } },
    create: { partnerId: server.id, speciesId: species.id, reason: str(formData, 'reason') },
    update: { reason: str(formData, 'reason') },
  });

  revalidatePath('/painel-parceiro');
  revalidatePath(`/partners/${server.slug}`);
}

export async function removeBanEntry(entryId: string) {
  const user = await requirePartnerUser();
  const server = await requireOwnServer(user.id);
  await prisma.partnerBanEntry.deleteMany({ where: { id: entryId, partnerId: server.id } });
  revalidatePath('/painel-parceiro');
  revalidatePath(`/partners/${server.slug}`);
}

export async function updateSpecialRules(formData: FormData) {
  const user = await requirePartnerUser();
  const server = await requireOwnServer(user.id);
  await prisma.partnerServer.update({
    where: { id: server.id },
    data: { specialRules: (str(formData, 'specialRules') ?? '').slice(0, 3000) },
  });
  revalidatePath('/painel-parceiro');
  revalidatePath(`/partners/${server.slug}`);
}

export async function linkRecommendedTeam(formData: FormData) {
  const user = await requirePartnerUser();
  const server = await requireOwnServer(user.id);

  const teamId = str(formData, 'teamId');
  if (!teamId) throw new Error('Selecione um time.');

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team || team.ownerId !== user.id) throw new Error('Time não encontrado.');

  await prisma.team.update({ where: { id: teamId }, data: { partnerId: server.id } });

  revalidatePath('/painel-parceiro');
  revalidatePath(`/partners/${server.slug}`);
}

export async function unlinkRecommendedTeam(teamId: string) {
  const user = await requirePartnerUser();
  const server = await requireOwnServer(user.id);
  await prisma.team.updateMany({
    where: { id: teamId, partnerId: server.id },
    data: { partnerId: null },
  });
  revalidatePath('/painel-parceiro');
  revalidatePath(`/partners/${server.slug}`);
}
