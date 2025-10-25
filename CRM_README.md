# RD & Company CRM System

A comprehensive Customer Relationship Management (CRM) system built with React and Material-UI, designed specifically for RD & Company's business needs.

## 🚀 Features

### 1. User Management System
- **Role-based Access Control**: Admin, Sales Person, Office Staff, Client
- **Permission Management**: Granular permissions for different modules
- **User CRUD Operations**: Create, read, update, and delete users
- **Search and Filter**: Find users by name, email, or role

### 2. Order Management
- **Client Auto-selection**: Automatic client selection for logged-in clients
- **Order Details**: Rich text input for detailed order descriptions
- **Status Tracking**: 
  - Pending
  - Ordered with Supplier
  - Billing & Dispatch
  - Delivered
- **Remarks System**: Additional notes and comments
- **Search and Filter**: Filter by status, search by client or order details

### 3. Ledger Request Management
- **Client Request System**: Clients can request ledger documents
- **Admin Upload**: Admins can upload ledger files
- **Status Tracking**:
  - Pending (awaiting upload)
  - Uploaded (awaiting confirmation)
  - Confirmed (available for download)
- **File Management**: Support for PDF, Excel, and CSV files
- **Download/View**: Confirmed ledgers available for download

### 4. Daily Task Management
- **Task Creation**: Create tasks with titles, descriptions, and priorities
- **Status Management**:
  - Pending
  - Done
  - Completed
- **Priority Levels**: Low, Medium, High, Urgent
- **Assignment**: Assign tasks to specific users
- **Due Dates**: Set and track task deadlines
- **Quick Actions**: One-click status updates

### 5. Attendance Management
- **Check-in/Check-out**: Time tracking for office staff and sales persons
- **Status Types**:
  - Present
  - Late
  - Half Day
  - Absent
  - Leave
- **Hours Calculation**: Automatic calculation of worked hours
- **Daily Reports**: View attendance by date
- **Quick Actions**: One-click attendance marking

### 6. Sales Person Reporting
- **Visit Tracking**: Record client visits with dates
- **Order Integration**: Link visits to new orders
- **Photo Upload**: Upload visit photos as evidence
- **Order Value Tracking**: Record monetary value of orders
- **Remarks**: Detailed visit notes and observations
- **Client Selection**: Choose from existing clients

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18.2.0**: Modern React with hooks
- **Material-UI 5.12.3**: Component library and theming
- **React Router 6.11.0**: Client-side routing
- **Chart.js 4.3.0**: Data visualization
- **Emotion**: CSS-in-JS styling

### Project Structure
```
src/
├── contexts/
│   └── AuthContext.js          # Authentication and authorization
├── layouts/
│   ├── user-management/        # User management module
│   ├── order-management/       # Order management module
│   ├── ledger-management/      # Ledger request management
│   ├── task-management/        # Daily task management
│   ├── attendance-management/  # Attendance tracking
│   ├── sales-reporting/        # Sales person reporting
│   └── authentication/         # Login/signup pages
├── components/
│   └── RoleBasedRoute.js       # Route protection component
└── assets/                     # Images, themes, and static assets
```

## 🔐 Authentication & Authorization

### User Roles
1. **Admin**: Full access to all modules
2. **Sales Person**: Order management, task management, attendance, reporting
3. **Office Staff**: Order management, task management, attendance
4. **Client**: Order management, ledger requests, task viewing

### Permissions
- `manage_users`: Create, edit, delete users
- `view_users`: View user list
- `manage_orders`: Full order management
- `create_orders`: Create new orders
- `view_orders`: View order list
- `manage_ledgers`: Upload and manage ledgers
- `request_ledgers`: Request ledger documents
- `manage_tasks`: Create and manage tasks
- `view_tasks`: View task list
- `manage_attendance`: Manage attendance records
- `view_attendance`: View attendance data
- `manage_reports`: Create and manage sales reports
- `view_reports`: View sales reports

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Default Login Credentials
- **Admin**: admin@rdcompany.com
- **Sales Person**: sales@rdcompany.com
- **Office Staff**: office@rdcompany.com
- **Client**: client@example.com

## 📱 Usage Guide

### For Administrators
1. **User Management**: Navigate to User Management to add/edit users and assign roles
2. **Order Oversight**: Monitor all orders across the system
3. **Ledger Management**: Upload ledger files when clients request them
4. **System Monitoring**: View attendance, tasks, and reports

### For Sales Persons
1. **Order Creation**: Create orders for clients with detailed descriptions
2. **Task Management**: Manage daily tasks and track progress
3. **Attendance**: Check in/out and mark attendance status
4. **Reporting**: Submit visit reports with photos and order details

### For Office Staff
1. **Order Processing**: Update order statuses and manage order flow
2. **Task Management**: Create and manage tasks
3. **Attendance**: Track daily attendance
4. **Ledger Support**: Assist with ledger requests

### For Clients
1. **Order Placement**: Create orders (client auto-selected)
2. **Order Tracking**: View order status and details
3. **Ledger Requests**: Request ledger documents
4. **Task Viewing**: View assigned tasks

## 🔧 Configuration

### Adding New Roles
1. Update `USER_ROLES` in `src/contexts/AuthContext.js`
2. Define permissions in `ROLE_PERMISSIONS`
3. Update navigation in `src/routes.js`

### Customizing Permissions
1. Add new permissions to `PERMISSIONS` object
2. Update `ROLE_PERMISSIONS` mapping
3. Use `hasPermission()` hook in components

### Styling and Theming
- Modify `src/assets/theme/` for custom themes
- Update component styles in individual layout files
- Use Material-UI's theming system for consistent design

## 📊 Data Management

### Mock Data
The system currently uses mock data for demonstration. To integrate with a real backend:

1. Replace mock API calls in each layout component
2. Update data structures in `data.js` files
3. Implement proper error handling and loading states
4. Add data validation and sanitization

### Database Schema Recommendations
- Users table with roles and permissions
- Orders table with status tracking
- Ledger requests table with file management
- Tasks table with assignment and status
- Attendance table with time tracking
- Sales reports table with visit data

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables
Create a `.env` file with:
```
REACT_APP_API_URL=your_api_url
REACT_APP_UPLOAD_URL=your_upload_url
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Future Enhancements

- Real-time notifications
- Advanced reporting and analytics
- Mobile app development
- API integration
- Advanced file management
- Email notifications
- Calendar integration
- Advanced search and filtering
- Data export capabilities
- Audit logging
