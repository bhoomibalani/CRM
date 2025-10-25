# Complete API Integration Explanation - Ledger System

## 🏗️ Architecture Overview

```
Frontend (React) → API Routes → Middleware → Controller → Model → Database
     ↓              ↓           ↓           ↓         ↓        ↓
  ledgerApi.js → api.php → ApiAuthenticate → ledgerController → Ledger → SQLite
```

## 📊 Complete Data Flow

### 1. **DATABASE LAYER** (SQLite)
```sql
-- ledgers table structure
CREATE TABLE ledgers (
    id INTEGER PRIMARY KEY,
    request_id VARCHAR(255),
    client_id INTEGER,
    request_details TEXT,
    additional_notes TEXT,
    status VARCHAR(50),
    request_date DATETIME,
    requested_by INTEGER,
    uploaded_date DATETIME,
    uploaded_by INTEGER,
    file_path VARCHAR(255),
    file_name VARCHAR(255),
    file_size INTEGER,
    created_at DATETIME,
    updated_at DATETIME
);
```

### 2. **MODEL LAYER** (Eloquent ORM)
```php
// app/Models/Ledger.php
class Ledger extends Model
{
    // Mass assignment protection
    protected $fillable = [
        'request_id', 'client_id', 'request_details', 
        'additional_notes', 'status', 'request_date',
        'requested_by', 'uploaded_date', 'uploaded_by',
        'file_path', 'file_name', 'file_size'
    ];

    // Data type casting
    protected $casts = [
        'request_date' => 'datetime',
        'uploaded_date' => 'datetime',
    ];

    // Relationships
    public function client() {
        return $this->belongsTo(User::class, 'client_id');
    }
    
    public function requester() {
        return $this->belongsTo(User::class, 'requested_by');
    }
    
    public function uploader() {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // Business logic methods
    public function canBeUploaded() {
        return $this->status === self::STATUS_PENDING;
    }
}
```

### 3. **ROUTES LAYER** (API Endpoints)
```php
// routes/api.php
Route::middleware('api.auth')->group(function () {
    Route::prefix('ledgers')->group(function () {
        Route::get('/', [ledgerController::class, 'index']);        // GET /api/ledgers
        Route::post('/', [ledgerController::class, 'store']);       // POST /api/ledgers
        Route::get('/{id}', [ledgerController::class, 'show']);     // GET /api/ledgers/{id}
        Route::put('/{id}', [ledgerController::class, 'update']);   // PUT /api/ledgers/{id}
        Route::delete('/{id}', [ledgerController::class, 'destroy']); // DELETE /api/ledgers/{id}
        Route::post('/{id}/upload', [ledgerController::class, 'upload']); // POST /api/ledgers/{id}/upload
        Route::get('/{id}/download', [ledgerController::class, 'download']); // GET /api/ledgers/{id}/download
    });
});
```

### 4. **MIDDLEWARE LAYER** (Authentication)
```php
// app/Http/Middleware/ApiAuthenticate.php
class ApiAuthenticate
{
    public function handle(Request $request, Closure $next)
    {
        // Check Sanctum authentication
        if (!Auth::guard('sanctum')->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        // Set user in request for controller access
        $user = Auth::guard('sanctum')->user();
        $request->setUserResolver(function () use ($user) {
            return $user;
        });

        return $next($request);
    }
}
```

### 5. **CONTROLLER LAYER** (Business Logic)
```php
// app/Http/Controllers/ledgerController.php
class ledgerController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $query = Ledger::with(['client', 'requester', 'uploader']);

            // Role-based filtering
            if ($user->role === 'client') {
                $query->where('client_id', $user->id);
            }

            // Apply filters
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            $ledgers = $query->orderBy('request_date', 'desc')->get();
            
            return response()->json([
                'success' => true,
                'data' => $ledgers,
                'message' => 'Ledger requests fetched successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $user = $request->user();

            // Validation
            $validator = Validator::make($request->all(), [
                'client_id' => 'required|exists:users,id',
                'request_details' => 'required|string|max:1000',
                'additional_notes' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Role-based permissions
            if (!in_array($user->role, ['client', 'sales'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only clients and sales can request ledgers'
                ], 403);
            }

            // Create ledger
            $ledger = Ledger::create([
                'request_id' => 'LED-' . strtoupper(Str::random(6)),
                'client_id' => $request->client_id,
                'request_details' => $request->request_details,
                'additional_notes' => $request->additional_notes,
                'status' => Ledger::STATUS_PENDING,
                'request_date' => now(),
                'requested_by' => $user->id,
            ]);

            $ledger->load(['client', 'requester']);

            return response()->json([
                'success' => true,
                'data' => $ledger,
                'message' => 'Ledger request created successfully'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating ledger request: ' . $e->getMessage()
            ], 500);
        }
    }
}
```

### 6. **FRONTEND LAYER** (React/JavaScript)
```javascript
// src/services/ledgerApi.js
class LedgerApiService {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL; // http://127.0.0.1:8000
    }

    getAuthHeaders() {
        const token = localStorage.getItem("crm_token");
        return {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
        };
    }

    async getLedgers(filters = {}) {
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.search) params.append('search', filters.search);

            const url = `${this.baseUrl}/api/ledgers${params.toString() ? `?${params.toString()}` : ''}`;
            
            const response = await fetch(url, {
                method: "GET",
                headers: this.getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching ledgers:", error);
            throw error;
        }
    }

    async createLedger(ledgerData) {
        try {
            // Frontend validation
            const validation = this.validateLedgerData(ledgerData);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            const response = await fetch(`${this.baseUrl}/api/ledgers`, {
                method: "POST",
                headers: this.getAuthHeaders(),
                body: JSON.stringify(ledgerData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error creating ledger:", error);
            throw error;
        }
    }
}
```

## 🔄 Complete Request Flow Example

### **CREATE LEDGER REQUEST FLOW**

1. **Frontend User Action**
   ```javascript
   // User clicks "Submit Request" button
   const ledgerData = {
       client_id: 1,
       request_details: "Need Q4 2024 ledger",
       additional_notes: "Include all transactions"
   };
   await ledgerApi.createLedger(ledgerData);
   ```

2. **Frontend API Service**
   ```javascript
   // ledgerApi.js - validate and send request
   const response = await fetch('http://127.0.0.1:8000/api/ledgers', {
       method: 'POST',
       headers: {
           'Content-Type': 'application/json',
           'Authorization': 'Bearer 1|abc123...'
       },
       body: JSON.stringify(ledgerData)
   });
   ```

3. **Laravel Route Matching**
   ```php
   // routes/api.php
   Route::post('/', [ledgerController::class, 'store']); // Matches POST /api/ledgers
   ```

4. **Middleware Authentication**
   ```php
   // ApiAuthenticate middleware
   $user = Auth::guard('sanctum')->user(); // Extract user from token
   $request->setUserResolver(function () use ($user) {
       return $user;
   });
   ```

5. **Controller Processing**
   ```php
   // ledgerController@store
   public function store(Request $request) {
       $user = $request->user(); // Get authenticated user
       
       // Validate input
       $validator = Validator::make($request->all(), [...]);
       
       // Check permissions
       if (!in_array($user->role, ['client', 'sales'])) {
           return response()->json(['message' => 'Unauthorized'], 403);
       }
       
       // Create record
       $ledger = Ledger::create([...]);
       
       return response()->json(['success' => true, 'data' => $ledger]);
   }
   ```

6. **Model Database Operation**
   ```php
   // Ledger model
   $ledger = Ledger::create([
       'request_id' => 'LED-ABC123',
       'client_id' => 1,
       'request_details' => 'Need Q4 2024 ledger',
       'status' => 'pending',
       'requested_by' => 7
   ]);
   ```

7. **Database Insert**
   ```sql
   INSERT INTO ledgers (request_id, client_id, request_details, status, requested_by, created_at)
   VALUES ('LED-ABC123', 1, 'Need Q4 2024 ledger', 'pending', 7, '2025-10-22 19:30:00');
   ```

8. **Response Back to Frontend**
   ```json
   {
       "success": true,
       "data": {
           "id": 17,
           "request_id": "LED-ABC123",
           "client_id": 1,
           "request_details": "Need Q4 2024 ledger",
           "status": "pending",
           "request_date": "2025-10-22T19:30:00.000000Z",
           "client": {"id": 1, "name": "Admin User", "email": "admin@rdcompany.com"},
           "requester": {"id": 7, "name": "sales", "email": "sales@rdcompany.com"}
       },
       "message": "Ledger request created successfully"
   }
   ```

## 🛡️ Security Layers

### **1. Authentication Layer**
- **Token-based**: Bearer token in Authorization header
- **Sanctum**: Laravel's API authentication
- **Session verification**: Token validation on each request

### **2. Authorization Layer**
- **Role-based access**: Different permissions per user role
- **Route protection**: Middleware blocks unauthorized access
- **Controller validation**: Double-check permissions in business logic

### **3. Validation Layer**
- **Frontend validation**: Client-side input validation
- **Backend validation**: Server-side data validation
- **Database constraints**: Database-level data integrity

### **4. Data Protection**
- **Mass assignment protection**: Only fillable fields can be set
- **SQL injection prevention**: Eloquent ORM parameterized queries
- **XSS protection**: Input sanitization and output escaping

## 📊 Error Handling Flow

```
Frontend Error → API Service → HTTP Response → Controller Exception → Model Error → Database Error
     ↓              ↓            ↓              ↓                   ↓            ↓
  User sees     Console.log   HTTP Status   Try/Catch Block    Validation   SQL Error
  notification  error         code          Exception          Error        Log
```

## 🔧 Key Integration Points

1. **Model ↔ Controller**: Eloquent relationships and business logic
2. **Controller ↔ Routes**: HTTP method mapping and parameter binding
3. **Routes ↔ Middleware**: Authentication and authorization
4. **Frontend ↔ Backend**: JSON API communication
5. **Database ↔ Model**: ORM abstraction and query building

This complete integration provides a robust, secure, and maintainable API system! 🚀
