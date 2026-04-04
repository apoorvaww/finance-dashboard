const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance Dashboard API',
      version: '1.0.0',
      description: `
## Finance Dashboard Backend API

Role-based access control finance management system.

### Roles & Permissions
| Action | Viewer | Analyst | Admin |
|--------|--------|---------|-------|
| Login / Register | ✅ | ✅ | ✅ |
| View records | ✅ | ✅ | ✅ |
| View dashboard | ✅ | ✅ | ✅ |
| View analytics | ❌ | ✅ | ✅ |
| Create records | ❌ | ❌ | ✅ |
| Update records | ❌ | ❌ | ✅ |
| Delete records | ❌ | ❌ | ✅ |
| Manage users   | ❌ | ❌ | ✅ |

### Quick Start
1. Register or use seeded credentials
2. POST /api/auth/login → copy the \`token\`
3. Click **Authorize** → paste \`Bearer <token>\`
4. Explore the endpoints
      `,
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        User: {
          type: 'object',
          properties: {
            id:         { type: 'integer' },
            name:       { type: 'string' },
            email:      { type: 'string', format: 'email' },
            role:       { type: 'string', enum: ['viewer', 'analyst', 'admin'] },
            status:     { type: 'string', enum: ['active', 'inactive'] },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        FinancialRecord: {
          type: 'object',
          properties: {
            id:          { type: 'integer' },
            user_id:     { type: 'integer' },
            amount:      { type: 'number', format: 'float' },
            type:        { type: 'string', enum: ['income', 'expense'] },
            category:    { type: 'string' },
            record_date: { type: 'string', format: 'date' },
            notes:       { type: 'string' },
            created_at:  { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
