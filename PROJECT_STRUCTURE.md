# Vermillion Project Structure

## 🎯 **SINGLE SOURCE OF TRUTH: `app/main.py`**

**IMPORTANT**: All models, schemas, and routes are defined in ONE file: `app/main.py`

### 📁 **Current File Structure**
```
app/
├── main.py           ← 🎯 ALL MODELS, SCHEMAS, AND ROUTES ARE HERE
├── __init__.py       ← Flask app initialization only
├── health.py         ← Health check endpoint
└── utils/            ← Utility functions
```

### 🚫 **Files That NO LONGER EXIST**
- ❌ `app/models.py` - DELETED (was causing conflicts)
- ❌ `app/routes.py` - DELETED (was causing conflicts)
- ❌ `run.py` - DELETED (was temporary)

### 🔧 **How to Make Changes**

#### **Adding a New Model**
1. **Add the model class** in `app/main.py` after existing models
2. **Add the schema class** in `app/main.py` after existing schemas  
3. **Add schema instances** in `app/main.py` after existing instances
4. **Add routes** in `app/main.py` after existing routes

#### **Example Structure in main.py**
```python
# 1. MODELS (at the top)
class NewModel(db.Model):
    # ... model definition

# 2. SCHEMAS (after models)
class NewModelSchema(ma.SQLAlchemySchema):
    # ... schema definition

# 3. SCHEMA INSTANCES (after schemas)
new_model_schema = NewModelSchema()
new_models_schema = NewModelSchema(many=True)

# 4. ROUTES (after schema instances)
@app.route('/api/new-models', methods=['GET'])
def get_new_models():
    # ... route logic
```

### 🛡️ **Prevention Rules**

1. **NEVER create separate model/schema files**
2. **NEVER duplicate definitions** across multiple files
3. **ALWAYS add new code to `main.py`**
4. **Use the schema verification script** before deploying changes

### 🔍 **Verification Commands**

```bash
# Verify schema matches models
python3 verify_schema.py

# Check if Flask server starts without errors
python3 -m flask --app app.main run --host=0.0.0.0 --port=5001 --debug

# Test endpoints work
curl http://localhost:5001/api/cost-codes
curl http://localhost:5001/api/cost-types  
curl http://localhost:5001/api/chartofaccounts
```

### 📊 **Current Models in main.py**
- ✅ CostType
- ✅ CostCode  
- ✅ Vendor
- ✅ Project
- ✅ ProjectContract
- ✅ ProjectContractItem
- ✅ ProjectContractItemAllocation
- ✅ ProjectBudget
- ✅ ProjectBudgetLine
- ✅ ChartOfAccounts

### 🌐 **Current API Endpoints**
- ✅ `/api/cost-codes` - Cost codes management
- ✅ `/api/cost-types` - Cost types management
- ✅ `/api/vendors` - Vendor management
- ✅ `/api/projects` - Project management
- ✅ `/api/project-contracts` - Contract management
- ✅ `/api/project-contract-items` - Contract items management
- ✅ `/api/project-budgets` - Budget management
- ✅ `/api/chartofaccounts` - Chart of accounts management

### 🚨 **If Something Breaks Again**

1. **Check `verify_schema.py` output** for schema mismatches
2. **Verify all models are in `main.py`** (not in other files)
3. **Check for duplicate class definitions** in `main.py`
4. **Ensure schema instances come AFTER class definitions**

### 💡 **Best Practices Going Forward**

1. **Single file architecture** - Keep everything in `main.py`
2. **Schema verification** - Run before any deployment
3. **No file splitting** - Resist the urge to "organize" into separate files
4. **Immediate testing** - Test endpoints after any changes
5. **Backup before changes** - Keep a working version

---

**Remember**: The key to stability is keeping everything in ONE place (`main.py`) and never splitting it up again!


