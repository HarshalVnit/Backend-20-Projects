require("dotenv").config();
const prisma = require("./src/db/prisma"); // Import our singleton connection

async function main() {
    console.log("Starting database seed...");

    // 1. Create a Theater
    const theater = await prisma.theater.create({
        data: {
            name: "MovieMax Grand Cinemas",
            location: "Nagpur, Maharashtra",
        }
    });
    console.log(`Created Theater: ${theater.name}`);

    // 2. Create a Screen inside that Theater
    const screen = await prisma.screen.create({
        data: {
            name: "Screen 1 - IMAX",
            theaterId: theater.id
        }
    });
    console.log(`Created Screen: ${screen.name}`);

    // 3. Generate the Physical Seats (Rows A, B, C | 10 seats per row)
    const rows = ["A", "B", "C"];
    const seatsToCreate = [];

    for (let row of rows) {
        for (let num = 1; num <= 10; num++) {
            seatsToCreate.push({
                row: row,
                number: num,
                screenId: screen.id
            });
        }
    }

    // Prisma's createMany lets us insert the whole array at once!
    await prisma.seat.createMany({ data: seatsToCreate });
    console.log(`Generated ${seatsToCreate.length} physical seats for ${screen.name}`);

    // 4. Add some Movies
    const movie1 = await prisma.movie.create({
        data: {
            title: "Dhurandar",
            description: "Life of Indian Syp",
            genre: "Action",
            durationMin: 210,
        }
    });

    const movie2 = await prisma.movie.create({
        data: {
            title: "Dhurandar The Revenge",
            description: "Destroying Underworld in Pakistan",
            genre: "Action",
            durationMin: 240,
        }
    });
    console.log(`Added Movies: ${movie1.title} & ${movie2.title}`);

    // 5. Schedule Showtimes (Using standard JavaScript Date objects)
    // Let's schedule one for tomorrow, and one for the day after
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(19, 0, 0, 0); // 7:00 PM

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    dayAfter.setHours(21, 30, 0, 0); // 9:30 PM

    await prisma.showtime.createMany({
        data: [
            { startTime: tomorrow, movieId: movie1.id, screenId: screen.id },
            { startTime: dayAfter, movieId: movie2.id, screenId: screen.id }
        ]
    });
    console.log(`Scheduled Showtimes for the movies!`);

    console.log("Seeding completely finished!");
}

// Execute the function and cleanly disconnect the database when done
main()
    .catch((e) => {
        console.error("Error during seeding:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });