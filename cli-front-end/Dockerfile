FROM rust:1.82

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libgtk-3-dev \
    libglib2.0-dev \
    && rm -rf /var/lib/apt/lists/*

COPY . .

RUN cargo build --release

CMD [ "bash" ]