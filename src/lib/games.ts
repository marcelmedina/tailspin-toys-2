import { and, asc, eq, inArray } from 'drizzle-orm';
import type { Database } from './db';
import { games, categories, publishers } from '../../db/schema';
import type { Game } from '../types/game';

/** Filters supported by the game catalog listing. */
export interface GameFilters {
    /** Category ids; games matching any selected category are returned. */
    categoryIds?: readonly number[];
    /** Publisher id to match, or null to include every publisher. */
    publisherId?: number | null;
}

const gameSelection = {
    id: games.id,
    title: games.title,
    description: games.description,
    starRating: games.starRating,
    categoryId: categories.id,
    categoryName: categories.name,
    publisherId: publishers.id,
    publisherName: publishers.name,
};

type GameSelectionRow = {
    id: number;
    title: string;
    description: string;
    starRating: number | null;
    categoryId: number | null;
    categoryName: string | null;
    publisherId: number | null;
    publisherName: string | null;
};

function mapGame(row: GameSelectionRow): Game {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        starRating: row.starRating,
        category:
            row.categoryId !== null && row.categoryName !== null
                ? { id: row.categoryId, name: row.categoryName }
                : null,
        publisher:
            row.publisherId !== null && row.publisherName !== null
                ? { id: row.publisherId, name: row.publisherName }
                : null,
    };
}

function baseGamesQuery(db: Database) {
    return db
        .select(gameSelection)
        .from(games)
        .leftJoin(categories, eq(games.categoryId, categories.id))
        .leftJoin(publishers, eq(games.publisherId, publishers.id));
}

/**
 * Returns games matching the supplied filters in title order.
 *
 * @param db Database client supplied by the caller.
 * @param filters Optional category and publisher filters.
 * @returns Matching games ordered alphabetically by title.
 */
export async function getAllGames(
    db: Database,
    filters: GameFilters = {},
): Promise<Game[]> {
    const conditions = [];
    if (filters.categoryIds && filters.categoryIds.length > 0) {
        conditions.push(inArray(games.categoryId, [...filters.categoryIds]));
    }
    if (filters.publisherId !== undefined && filters.publisherId !== null) {
        conditions.push(eq(games.publisherId, filters.publisherId));
    }

    const query = baseGamesQuery(db);
    const rows = await (conditions.length > 0
        ? query.where(and(...conditions))
        : query
    ).orderBy(asc(games.title));
    return rows.map(mapGame);
}

/**
 * Returns all game ids in title order.
 *
 * @param db Database client supplied by the caller.
 * @returns Game ids ordered alphabetically by title.
 */
export async function getAllGameIds(db: Database): Promise<number[]> {
    const rows = await db.select({ id: games.id }).from(games).orderBy(asc(games.title));
    return rows.map((row) => row.id);
}

/**
 * Returns a single game by id.
 *
 * @param db Database client supplied by the caller.
 * @param id Game id to find.
 * @returns The matching game, or null when it does not exist.
 */
export async function getGameById(db: Database, id: number): Promise<Game | null> {
    const row = await baseGamesQuery(db).where(eq(games.id, id)).get();
    return row ? mapGame(row) : null;
}

/**
 * Returns all categories in stable name order for catalog controls.
 *
 * @param db Database client supplied by the caller.
 * @returns Categories ordered alphabetically by name.
 */
export async function getAllCategories(
    db: Database,
): Promise<Array<{ id: number; name: string }>> {
    return db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .orderBy(asc(categories.name));
}

/**
 * Returns all publishers in stable name order for catalog controls.
 *
 * @param db Database client supplied by the caller.
 * @returns Publishers ordered alphabetically by name.
 */
export async function getAllPublishers(
    db: Database,
): Promise<Array<{ id: number; name: string }>> {
    return db
        .select({ id: publishers.id, name: publishers.name })
        .from(publishers)
        .orderBy(asc(publishers.name));
}
