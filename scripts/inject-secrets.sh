#!/bin/bash
# scripts/inject-secrets.sh
echo "Injected Secrets into .env.production"
echo "ELEVENLABS_API_KEY=$ELEVENLABS_API_KEY" >> .env.production
# Add other secrets here if needed
