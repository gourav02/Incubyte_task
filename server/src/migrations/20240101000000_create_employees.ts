import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createTable("employees", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.string("full_name", 200).notNullable();
    table.string("job_title", 100).notNullable();
    table.string("country", 100).notNullable();
    table.decimal("salary", 12, 2).notNullable();
    table.string("department", 100).notNullable();
    table.date("hire_date").notNullable();
    table.timestamps(true, true);

    table.index("country", "idx_employees_country");
    table.index("job_title", "idx_employees_job_title");
    table.index(["country", "job_title"], "idx_employees_country_job_title");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("employees");
}
