let io;

module.exports = {
  init: (httpServer) => {
    const { Server } = require('socket.io');
    io = new Server(httpServer, {
      cors: {
        origin: '*', 
        methods: ['GET', 'POST']
      }
    });

    io.on('connection', (socket) => {
      console.log(`🔌 جهاز متصل بالسوكيت: ${socket.id}`);

      socket.on('joinRoom', (room) => {
        socket.join(room);
        console.log(`🏠 السوكيت ${socket.id} انضم للغرفة: ${room}`);
      });

      socket.on('disconnect', () => {
        console.log(`❌ السوكيت ${socket.id} غادر الاتصال`);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io لم يتم تهيئته بعد!');
    }
    return io;
  }
};