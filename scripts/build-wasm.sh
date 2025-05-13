#!/bin/bash
set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building znn-pow WASM module...${NC}"

# Check if emcc is installed
if ! command -v emcc &> /dev/null; then
    echo -e "${RED}Error: Emscripten (emcc) not found!${NC}"
    echo -e "${YELLOW}Please install Emscripten SDK:${NC}"
    echo "  git clone https://github.com/emscripten-core/emsdk.git"
    echo "  cd emsdk"
    echo "  ./emsdk install latest"
    echo "  ./emsdk activate latest"
    echo "  source ./emsdk_env.sh"
    exit 1
fi

# Store project root
PROJECT_ROOT=$(pwd)

# Create directories if they don't exist
mkdir -p wasm/src
mkdir -p lib
cd wasm/src

# Clone or update the C++ PoW repository
if [ ! -d "znn-pow-links-cpp" ]; then
    echo -e "${GREEN}Cloning znn-pow-links-cpp repository...${NC}"
    git clone --recursive https://github.com/zenon-network/znn-pow-links-cpp.git
else
    echo -e "${YELLOW}Repository exists, pulling latest changes...${NC}"
    cd znn-pow-links-cpp
    git pull
    git submodule update --init --recursive
    cd ..
fi

cd znn-pow-links-cpp

# Create Emscripten wrapper
echo -e "${GREEN}Creating Emscripten wrapper...${NC}"
cat > src/pow_wasm_wrapper.cpp << 'EOF'
#include "pow_links.cpp"
#include <emscripten/emscripten.h>
#include <emscripten/bind.h>
#include <vector>

using namespace emscripten;

// Convert JS Uint8Array to InHash (32 bytes)
typedef std::array<uint8_t, 32> InHash;

std::string generatePoW(const std::string& hashHex, int64_t difficulty) {
    // Convert hex string to InHash
    InHash inHash;
    for (size_t i = 0; i < 32 && i * 2 < hashHex.length(); ++i) {
        std::string byteString = hashHex.substr(i * 2, 2);
        inHash[i] = static_cast<uint8_t>(strtol(byteString.c_str(), nullptr, 16));
    }

    // Generate PoW
    Hash nonce = generate(inHash, difficulty);

    // Convert result to hex string
    std::string result;
    const char* hexChars = "0123456789abcdef";
    for (size_t i = 0; i < 8; ++i) {
        result += hexChars[nonce[i] >> 4];
        result += hexChars[nonce[i] & 0x0F];
    }

    return result;
}

std::string benchmarkPoW(int64_t difficulty) {
    Hash nonce = benchmark(difficulty);

    // Convert result to hex string
    std::string result;
    const char* hexChars = "0123456789abcdef";
    for (size_t i = 0; i < 8; ++i) {
        result += hexChars[nonce[i] >> 4];
        result += hexChars[nonce[i] & 0x0F];
    }

    return result;
}

EMSCRIPTEN_BINDINGS(pow_module) {
    function("generate", &generatePoW);
    function("benchmark", &benchmarkPoW);
}
EOF

# Build with Emscripten
echo -e "${GREEN}Compiling with Emscripten...${NC}"

# First compile the C file separately
emcc \
    -O3 \
    -I./SHA3IUF \
    -c SHA3IUF/sha3.c \
    -o sha3.o

# Then compile and link everything together
em++ \
    -O3 \
    -std=c++17 \
    --bind \
    -s WASM=1 \
    -s MODULARIZE=1 \
    -s EXPORT_ES6=1 \
    -s EXPORT_NAME='createPowModule' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
    -I./SHA3IUF \
    src/pow_wasm_wrapper.cpp \
    sha3.o \
    -o "${PROJECT_ROOT}/lib/pow.js"

echo -e "${GREEN}WASM module built successfully!${NC}"
echo -e "Output files:"
echo -e "  - lib/pow.js"
echo -e "  - lib/pow.wasm"

# Go back to root
cd "${PROJECT_ROOT}"

echo -e "${GREEN}Done!${NC}"
