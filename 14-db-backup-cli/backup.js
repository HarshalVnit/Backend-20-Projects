#!/usr/bin/env node

const { Command } = require("commander");
const { Client } = require("pg"); 
const fs = require("fs/promises"); // Phase 5: File System
const path = require("path");      // Phase 5: Path handling

const program = new Command();

program
  .name("db-backup")
  .description("A CLI utility to backup a PostgreSQL database.")
  .version("1.0.0");

program
  .requiredOption("-h, --host <string>", "Database host URL")
  .requiredOption("-u, --user <string>", "Database username")
  .requiredOption("-p, --pass <string>", "Database password")
  .requiredOption("-d, --db <string>", "Database name")
  .requiredOption("-o, --out <string>", "Destination folder for the backup file");

program.parse(process.argv);
const options = program.opts();

const runBackup = async () => {
  console.log("🚀 Booting up Database Backup Utility...");
  console.log(`📡 Connecting to database: ${options.db} at ${options.host}...`);

  const client = new Client({
    host: options.host,
    user: options.user,
    password: options.pass,
    database: options.db,
    port: 5432, 
    ssl: { rejectUnauthorized: false }, 
  });

  try {
    await client.connect(); 
    console.log("✅ Connection established!\n");

    // ==========================================
    // --- PHASE 2: THE INSPECTOR ---
    // ==========================================
    console.log("🔍 Inspecting database architecture...");
    const tableQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE';
        `;

    const res = await client.query(tableQuery);
    const tables = res.rows.map((row) => row.table_name);

    if (tables.length === 0) {
      console.log("⚠️ No tables found in this database.");
      return; 
    }

    console.log(`📋 Found ${tables.length} tables:`, tables);

    const schemaDump = []; // This array holds all our final SQL text

    console.log("\n🏗️ Extracting blueprints and data...");

    // Loop through every table we found
    for (const tableName of tables) {
      console.log(`   -> Processing table: ${tableName}`);

      // ==========================================
      // --- PHASE 3: THE ARCHITECT (STRUCTURE) ---
      // ==========================================
      const columnQuery = `
                SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = $1
                ORDER BY ordinal_position;
            `;

      const colRes = await client.query(columnQuery, [tableName]);
      const columns = colRes.rows;

      let createTableStr = `-- Blueprint for table: ${tableName}\n`;
      createTableStr += `CREATE TABLE ${tableName} (\n`;

      const columnDefinitions = columns.map((col) => {
        let def = `  ${col.column_name} ${col.data_type}`;
        if (col.character_maximum_length) def += `(${col.character_maximum_length})`;
        if (col.is_nullable === "NO") def += ` NOT NULL`;
        if (col.column_default) def += ` DEFAULT ${col.column_default}`;
        return def;
      });

      createTableStr += columnDefinitions.join(",\n");
      createTableStr += `\n);\n\n`;

      schemaDump.push(createTableStr);

      // ==========================================
      // --- PHASE 4: THE SCRIBE (DATA) ---
      // ==========================================
      const dataQuery = `SELECT * FROM ${tableName};`;
      const dataRes = await client.query(dataQuery);
      const rows = dataRes.rows;

      if (rows.length > 0) {
        const exactColumns = Object.keys(rows[0]);
        const columnsString = exactColumns.join(", ");

        let insertStr = `-- Data for table: ${tableName}\n`;
        insertStr += `INSERT INTO ${tableName} (${columnsString}) VALUES \n`;

        const valueStrings = rows.map((row) => {
          const formattedValues = exactColumns.map((colName) => {
            const val = row[colName];

            if (val === null) return "NULL";
            
            if (typeof val === "string") {
              const escapedString = val.replace(/'/g, "''");
              return `'${escapedString}'`;
            }
            
            if (val instanceof Date) {
              return `'${val.toISOString()}'`;
            }

            return val;
          });

          return `  (${formattedValues.join(", ")})`;
        });

        insertStr += valueStrings.join(",\n");
        insertStr += `;\n\n`;

        schemaDump.push(insertStr);
      } else {
        schemaDump.push(`-- No data found for table: ${tableName}\n\n`);
      }
    }

    // ==========================================
    // --- PHASE 5: THE FILE SYSTEM ---
    // ==========================================
    console.log("\n💾 Saving backup to hard drive...");

    const backupFolder = path.resolve(options.out);
    await fs.mkdir(backupFolder, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${options.db}_backup_${timestamp}.sql`;
    
    const finalFilePath = path.join(backupFolder, fileName);
    const finalSqlContent = schemaDump.join('');

    await fs.writeFile(finalFilePath, finalSqlContent, 'utf8');

    console.log(`🎉 SUCCESS! Database backed up successfully.`);
    console.log(`📁 File saved at: ${finalFilePath}`);

  } catch (error) {
    console.error("❌ FATAL ERROR: Failed to connect or query the database.");
    console.error(error.message);
  } finally {
    await client.end();
    console.log("\n🔌 Disconnected from database.");
  }
};

runBackup();