# 🔬 HU7 Testing Suite

## Overview
Comprehensive testing interface for **Historia de Usuario 7** (Radiograph Detail View) - consolidated in a single folder for easy maintenance and discovery.

## 🎯 Purpose
This testing suite solves the authentication and backend connectivity issues that prevent proper HU7 testing by providing:

1. **Authentication Bypass** - Test HU7 without patient login
2. **Mock/Real Toggle** - Switch between test data and real backend
3. **Case Discovery** - Browse actual cases from MongoDB
4. **Visual Validation** - Verify UI matches design mockup exactly

## 📁 File Structure

```
app/hu7-testing/
├── page.tsx               # Main testing interface with tabs
├── detail-component.tsx   # HU7 detail view with mock/real backend toggle
├── backend-browser.tsx    # Real case discovery from GraphQL
└── README.md             # This documentation
```

## 🚀 Quick Start

### Access the Testing Suite
```bash
http://localhost:3001/hu7-testing
```

### Testing Modes

#### 🎭 Mock Mode (Default)
- Uses hardcoded test data
- Always works regardless of backend status
- Perfect for UI testing and development
- Consistent data for screenshots/demos

#### 🔗 Real Backend Mode
- Connects to GraphQL endpoint (localhost:8080/query)
- Queries actual MongoDB data
- Tests complete integration
- Falls back to mock if connection fails

## 🧪 Test Cases

### Pre-configured Test Cases
| Case ID | Status | Description |
|---------|--------|-------------|
| `1` | validated | Complete case with medical diagnosis |
| `2` | processed | AI analysis only |
| `3` | uploaded | Upload only, no processing |
| `507f1f77bcf86cd799439011` | test | MongoDB ObjectId format |

### Custom Testing
- Enter any case ID in the "Custom Case ID" field
- Toggle between Mock/Real backend modes
- Use Discovery tab to find real cases

## 🔍 Case Discovery

The **Discovery** tab provides:
- Live connection to GraphQL backend
- Browse real cases from MongoDB
- Search and filter functionality
- Click any case to test in main interface
- Detailed error diagnostics if connection fails

## 🎨 UI Validation

The interface perfectly matches the user's mockup:
- ✅ "Detalle de Radiografía" header with download button
- ✅ 2-column layout (left: image, right: patient info)
- ✅ Patient information cards with structured fields
- ✅ Blue-highlighted AI results with percentage
- ✅ Doctor comments with quote formatting
- ✅ Professional spacing and color scheme

## 🛠 Technical Details

### Components
- **RadiographDetailComponent**: Main HU7 view with backend toggle
- **BackendCaseBrowser**: Real case discovery interface
- **HU7TestingPage**: Tabbed testing interface

### Backend Integration
- **GraphQL Query**: `caseDetail(id: ID!)`
- **Endpoint**: `localhost:8080/query`
- **Authentication**: Bypassed for testing
- **Fallback**: Mock data if real backend fails

### Mock Data Structure
```typescript
{
  caseDetail: {
    id: string,
    radiografiaId: string,
    urlImagen: string,
    estado: string,
    fechaSubida: string,
    preDiagnostic: {
      resultadosModelo: {
        probNeumonia: number,
        etiqueta: string
      }
    },
    diagnostic?: {
      comentarios: string,
      doctorNombre: string,
      fechaRevision: string
    }
  }
}
```

## 🔧 Troubleshooting

### "Usuario no autorizado" Error
- **Cause**: Original HU7 component requires patient authentication
- **Solution**: Use this testing suite (bypasses auth)

### Backend Connection Issues
- Check BusinessLogic service is running on port 8080
- Verify MongoDB has data in 'prediagnosticos' collection
- Use Discovery tab for detailed error diagnostics
- Falls back to mock data automatically

### No Real Cases Found
- Upload radiographs first (HU2)
- Check MongoDB collections are populated
- Use mock mode for consistent testing

## 📞 Related URLs

| URL | Purpose |
|-----|---------|
| `http://localhost:3001/hu7-testing` | This testing suite |
| `http://localhost:3001/patient/dashboard` | Production dashboard (requires auth) |
| `http://localhost:3001/patient/radiograph/[id]` | Direct HU7 access (requires auth) |
| `http://localhost:8080/query` | GraphQL backend endpoint |

## 🎯 Best Practices

### For UI Development
1. Use **Mock Mode** for consistent visual testing
2. Test all pre-configured cases
3. Verify responsive design on different screen sizes
4. Compare with user's mockup image

### For Backend Integration
1. Use **Real Backend Mode** to test integration
2. Use **Discovery tab** to find actual case IDs
3. Verify GraphQL queries and responses
4. Test error handling scenarios

### For Production Readiness
1. Test both mock and real modes
2. Verify fallback behavior
3. Check performance with real data
4. Validate authentication flow in production dashboard

---

## 📝 Notes

- This testing suite is specifically for HU7 development and testing
- Authentication is intentionally bypassed for testing purposes
- Production dashboard still requires proper patient authentication
- All testing functionality is consolidated in this single folder