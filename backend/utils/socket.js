import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io = null;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            credentials: true,
            methods: ["GET", "POST"]
        }
    });

    // Socket authentication middleware
    io.use((socket, next) => {
        try {
            // Extract token from cookie header or handshake auth payload
            let token = socket.handshake.auth?.token;
            const cookieHeader = socket.handshake.headers?.cookie;

            if (!token && cookieHeader) {
                const cookies = Object.fromEntries(
                    cookieHeader.split('; ').map((c) => {
                        const [k, ...v] = c.split('=');
                        return [k, decodeURIComponent(v.join('='))];
                    })
                );
                token = cookies.aura_session;
            }

            if (!token) {
                return next(new Error("Authentication Error: Invalid or missing session token"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded; // Attach user payload ({ email }) to socket
            next();
        } catch (err) {
            console.error("Socket Auth Error:", err.message);
            return next(new Error("Authentication Error: Invalid or expired token"));
        }
    });

    // Socket connection handler
    io.on('connection', (socket) => {
        console.log(`🔌 Client connected via WebSocket: ${socket.id} (User: ${socket.user?.email})`);

        // Join room specific to this user for private notifications

        if(socket.user?.id) {
            socket.join(`user:${socket.user.id}`);
        }
        if (socket.user?.email) {
            socket.join(`user:${socket.user.email}`);
        }

        socket.on('disconnect', () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

// Helper getter to access io instance across controllers/routes
export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io has not been initialized. Call initSocket(httpServer) first.");
    }
    return io;
};

// Helper function to send notification to a specific user
export const sendNotificationToUser = (userTarget, event, data) => {
    if (io) {
        io.to(`user:${userTarget}`).emit(event, data);
    }
};

// Helper function to broadcast alert/event to all connected users
export const broadcastEvent = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};
