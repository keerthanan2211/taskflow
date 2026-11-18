/** Fields that are safe to send to clients. Never select passwordHash in API responses. */
export const publicUserSelect = { id: true, email: true, name: true } as const;
