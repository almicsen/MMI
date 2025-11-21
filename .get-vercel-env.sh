#!/bin/bash
# Helper script to display environment variables for Vercel
# This shows the variable names and values (for copying to Vercel)

echo "=========================================="
echo "Firebase Environment Variables for Vercel"
echo "=========================================="
echo ""
echo "Copy these to Vercel Dashboard → Settings → Environment Variables"
echo ""
echo "Required Variables:"
echo ""

if [ -f .env.local ]; then
  grep "^NEXT_PUBLIC_FIREBASE_" .env.local | while IFS='=' read -r key value; do
    echo "Variable Name: $key"
    echo "Value: $value"
    echo "Environment: Production, Preview, Development (select all three)"
    echo "---"
  done
  
  echo ""
  echo "Optional Cloudinary Variables:"
  grep "^NEXT_PUBLIC_CLOUDINARY_\|^CLOUDINARY_" .env.local | while IFS='=' read -r key value; do
    echo "Variable Name: $key"
    echo "Value: $value"
    echo "Environment: Production, Preview, Development (select all three)"
    echo "---"
  done
  
  echo ""
  echo "Optional Google Analytics:"
  grep "^NEXT_PUBLIC_GA_ID" .env.local | while IFS='=' read -r key value; do
    echo "Variable Name: $key"
    echo "Value: $value"
    echo "Environment: Production, Preview, Development (select all three)"
    echo "---"
  done
else
  echo "Error: .env.local file not found"
fi

echo ""
echo "=========================================="
