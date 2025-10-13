#!/usr/bin/env python3
"""
Quick test script to verify backend functionality
Run: python test_backend.py
"""

import requests
import sys
import os

# Backend URL (update if needed)
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

def test_health():
    """Test health endpoint"""
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Health check passed")
            print(f"   FFmpeg: {data['services'].get('ffmpeg', 'unknown')}")
            print(f"   Whisper: {data['services'].get('whisper', 'unknown')}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {str(e)}")
        return False

def test_status():
    """Test status endpoint"""
    print("\nTesting status endpoint...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/status", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Status check passed")
            print(f"   API: {data.get('api', 'unknown')}")
            print(f"   Version: {data.get('version', 'unknown')}")
            return True
        else:
            print(f"❌ Status check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Status check error: {str(e)}")
        return False

def test_ai_status():
    """Test AI service status"""
    print("\nTesting AI service...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/ai/status", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ AI service check passed")
            print(f"   Chatbot: {data['services'].get('chatbot', 'unknown')}")
            print(f"   Text Gen: {data['services'].get('text_generation', 'unknown')}")
            return True
        else:
            print(f"❌ AI service check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ AI service check error: {str(e)}")
        return False

def test_whisper_models():
    """Test Whisper models endpoint"""
    print("\nTesting Whisper models...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/video/whisper-models", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Whisper models check passed")
            print(f"   Available models: {len(data.get('models', []))}")
            return True
        else:
            print(f"❌ Whisper models check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Whisper models check error: {str(e)}")
        return False

def test_file_list():
    """Test file listing"""
    print("\nTesting file list...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/files/list", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ File list check passed")
            print(f"   Files: {data.get('count', 0)}")
            return True
        else:
            print(f"❌ File list check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ File list check error: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("=" * 50)
    print("VEdit Backend Test Suite")
    print(f"Testing: {BACKEND_URL}")
    print("=" * 50)
    
    tests = [
        test_health,
        test_status,
        test_ai_status,
        test_whisper_models,
        test_file_list
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        if test():
            passed += 1
        else:
            failed += 1
    
    print("\n" + "=" * 50)
    print(f"Tests completed: {passed} passed, {failed} failed")
    print("=" * 50)
    
    if failed == 0:
        print("\n✅ All tests passed! Backend is working correctly.")
        print(f"\n🚀 Your backend is ready at: {BACKEND_URL}")
        print(f"📚 API docs: {BACKEND_URL}/docs")
        return 0
    else:
        print(f"\n❌ {failed} test(s) failed. Check the errors above.")
        print("\nTroubleshooting:")
        print("1. Make sure backend is running: uvicorn main:app --reload")
        print("2. Check if correct URL is set")
        print("3. Check backend logs for errors")
        return 1

if __name__ == "__main__":
    sys.exit(main())

