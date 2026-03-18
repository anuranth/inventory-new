# MySQL Setup

This project has been converted from SQLite to MySQL at the Prisma configuration level.

## 1. Create the MySQL database

```sql
CREATE DATABASE smartinventory;
```

## 2. Update environment variables

Set `DATABASE_URL` in [`.env`](C:\Users\anura\Downloads\SmartInventory_new\SmartInventory_new\backend\.env) to your real MySQL connection string:

```env
DATABASE_URL="mysql://root:password@localhost:3306/smartinventory"
PORT=5001
```

Example with a custom user:

```env
DATABASE_URL="mysql://smartinventory_user:your_password@localhost:3306/smartinventory"
```

## 3. Generate the Prisma client

```bash
npm run prisma:generate
```

## 4. Push the schema into MySQL

```bash
npm run db:push
```

This creates the MySQL tables based on `prisma/schema.prisma`.

## 5. Start the backend

```bash
npm start
```

The backend is configured to run on port `5001` by default.

## Important note about old SQLite data

Your old SQLite file is still present at `prisma/dev.db`, but it is no longer used after this conversion.

If you need your old data in MySQL, you must migrate the records separately. Since this project currently does not include a SQLite driver in `node_modules`, the safest path is:

1. Keep `prisma/dev.db` as a backup.
2. Create the MySQL schema with `npm run db:push`.
3. Re-enter the data manually or import it using an external database tool.

## Important note about old Prisma migrations

The existing files under `prisma/migrations/` were originally created for SQLite.

For this MySQL version, use:

```bash
npm run db:push
```

Do not rely on the old SQLite SQL migration files for MySQL deployment.
