require("dotenv").config();

const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();

const PORT = 4000;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

app.use(express.json());


// ========================================
// SQLITE DATABASE
// ========================================

const db = new sqlite3.Database("./nms.db", (err) => {

    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("Connected to SQLite database");
    }

});


// ========================================
// CREATE TABLES
// ========================================

db.serialize(() => {

    // DEVICES TABLE
    db.run(`
        CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            ip TEXT NOT NULL UNIQUE,
            status TEXT NOT NULL
        )
    `, (err) => {

        if (err) {
            console.error("Devices table error:", err.message);
        } else {
            console.log("Devices table ready");
        }

    });


    // ALARMS TABLE
    db.run(`
        CREATE TABLE IF NOT EXISTS alarms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device TEXT NOT NULL,
            severity TEXT NOT NULL,
            message TEXT NOT NULL
        )
    `, (err) => {

        if (err) {
            console.error("Alarms table error:", err.message);
        } else {
            console.log("Alarms table ready");
        }

    });


    // SEED DEVICES ONLY IF EMPTY
    db.get(
        `SELECT COUNT(*) AS count FROM devices`,
        (err, row) => {

            if (err) {
                console.error(err.message);
                return;
            }

            if (row.count === 0) {

                db.run(`
                    INSERT INTO devices
                    (name, ip, status)
                    VALUES
                    ('Router-01', '192.168.1.10', 'Online'),
                    ('Switch-01', '192.168.1.20', 'Online')
                `);

                console.log("Initial devices added");

            }

        }
    );


    // SEED ALARMS ONLY IF EMPTY
    db.get(
        `SELECT COUNT(*) AS count FROM alarms`,
        (err, row) => {

            if (err) {
                console.error(err.message);
                return;
            }

            if (row.count === 0) {

                db.run(`
                    INSERT INTO alarms
                    (device, severity, message)
                    VALUES
                    ('Router-01', 'High', 'High CPU usage'),
                    ('Switch-01', 'Medium', 'Packet loss detected')
                `);

                console.log("Initial alarms added");

            }

        }
    );

});


// ========================================
// INTERNAL API KEY MIDDLEWARE
// ========================================

const verifyInternalApiKey = (req, res, next) => {

    const apiKey = req.headers["x-api-key"];

    if (!apiKey || apiKey !== INTERNAL_API_KEY) {

        return res.status(403).json({
            message: "Forbidden. Invalid internal API key."
        });

    }

    next();

};


// ========================================
// HEALTH CHECK
// ========================================

app.get("/", (req, res) => {

    res.json({
        message: "NMS Server is running"
    });

});


// ========================================
// GET ALL DEVICES
// ========================================

app.get(
    "/api/devices",
    verifyInternalApiKey,
    (req, res) => {

        db.all(
            `SELECT * FROM devices`,
            (err, devices) => {

                if (err) {

                    return res.status(500).json({
                        message: "Failed to fetch devices"
                    });

                }

                res.json({
                    success: true,
                    devices: devices
                });

            }
        );

    }
);


// ========================================
// GET DEVICE BY ID
// ========================================

app.get(
    "/api/devices/:id",
    verifyInternalApiKey,
    (req, res) => {

        const deviceId = parseInt(req.params.id);

        db.get(
            `SELECT * FROM devices WHERE id = ?`,
            [deviceId],
            (err, device) => {

                if (err) {

                    return res.status(500).json({
                        message: "Failed to fetch device"
                    });

                }

                if (!device) {

                    return res.status(404).json({
                        message: "Device not found"
                    });

                }

                res.json({
                    success: true,
                    device: device
                });

            }
        );

    }
);


// ========================================
// CREATE DEVICE
// ========================================

app.post(
    "/api/devices",
    verifyInternalApiKey,
    (req, res) => {

        const { name, ip, status } = req.body;

        if (!name || !ip || !status) {

            return res.status(400).json({
                message: "Name, IP and status are required"
            });

        }

        const sql = `
            INSERT INTO devices
            (name, ip, status)
            VALUES (?, ?, ?)
        `;

        db.run(
            sql,
            [name, ip, status],
            function (err) {

                if (err) {

                    if (err.message.includes("UNIQUE")) {

                        return res.status(409).json({
                            message: "Device with this IP already exists"
                        });

                    }

                    return res.status(500).json({
                        message: "Failed to create device"
                    });

                }

                const newDevice = {
                    id: this.lastID,
                    name: name,
                    ip: ip,
                    status: status
                };

                res.status(201).json({
                    success: true,
                    message: "Device created successfully",
                    device: newDevice
                });

            }
        );

    }
);


// ========================================
// GET ALL ALARMS
// ========================================

app.get(
    "/api/alarms",
    verifyInternalApiKey,
    (req, res) => {

        db.all(
            `SELECT * FROM alarms`,
            (err, alarms) => {

                if (err) {

                    return res.status(500).json({
                        message: "Failed to fetch alarms"
                    });

                }

                res.json({
                    success: true,
                    alarms: alarms
                });

            }
        );

    }
);


// ========================================
// NETWORK STATUS
// ========================================

app.get(
    "/api/network/status",
    verifyInternalApiKey,
    (req, res) => {

        db.get(
            `
            SELECT COUNT(*) AS connectedDevices
            FROM devices
            WHERE status = 'Online'
            `,
            (deviceErr, deviceRow) => {

                if (deviceErr) {

                    return res.status(500).json({
                        message: "Failed to fetch network status"
                    });

                }

                db.get(
                    `SELECT COUNT(*) AS activeAlarms FROM alarms`,
                    (alarmErr, alarmRow) => {

                        if (alarmErr) {

                            return res.status(500).json({
                                message: "Failed to fetch network status"
                            });

                        }

                        res.json({

                            status: "Operational",

                            connectedDevices:
                                deviceRow.connectedDevices,

                            activeAlarms:
                                alarmRow.activeAlarms

                        });

                    }
                );

            }
        );

    }
);


// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {

    console.log(
        `NMS Server running on http://localhost:${PORT}`
    );

});