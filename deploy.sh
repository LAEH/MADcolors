#!/bin/bash
# Deploy Munsell to Firebase Hosting

set -e

echo "🚀 Deploying Munsell..."

# Build the app
echo "📦 Building..."
npm run build

# Deploy to Firebase
echo "🔥 Deploying to Firebase..."
firebase deploy --only hosting

echo "✅ Deployment complete!"
echo "🌐 Live at: https://munsell.laeh.ai"
