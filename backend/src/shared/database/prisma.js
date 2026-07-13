const { PrismaClient } = require("@prisma/client");
const { contextStorage } = require("../utils/context");

const basePrisma = new PrismaClient();

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const store = contextStorage.getStore();
        const schoolId = store?.schoolId;

        const tenantModels = [
          "User", 
          "Student", 
          "Class", 
          "Modality", 
          "AuditLog"
        ];

        if (schoolId && tenantModels.includes(model)) {
          if (operation === "create") {
            args.data = args.data || {};
            args.data.schoolId = schoolId;
          } else if (operation === "createMany") {
            if (Array.isArray(args.data)) {
              args.data.forEach(item => {
                item.schoolId = schoolId;
              });
            } else if (args.data) {
              args.data.schoolId = schoolId;
            }
          } else {
            args.where = args.where || {};
            args.where.schoolId = schoolId;
          }
        }

        return query(args);
      }
    }
  }
});

module.exports = { prisma, basePrisma };
