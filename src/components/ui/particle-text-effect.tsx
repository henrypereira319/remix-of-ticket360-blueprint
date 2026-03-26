"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Vector2D {
  x: number;
  y: number;
}

class Particle {
  pos: Vector2D = { x: 0, y: 0 };
  vel: Vector2D = { x: 0, y: 0 };
  acc: Vector2D = { x: 0, y: 0 };
  target: Vector2D = { x: 0, y: 0 };

  closeEnoughTarget = 100;
  maxSpeed = 1.0;
  maxForce = 0.1;
  particleSize = 10;
  isKilled = false;

  startColor = { r: 0, g: 0, b: 0 };
  targetColor = { r: 0, g: 0, b: 0 };
  colorWeight = 0;
  colorBlendRate = 0.01;

  move() {
    let proximityMult = 1;
    const distance = Math.sqrt(Math.pow(this.pos.x - this.target.x, 2) + Math.pow(this.pos.y - this.target.y, 2));

    if (distance < this.closeEnoughTarget) {
      proximityMult = distance / this.closeEnoughTarget;
    }

    const towardsTarget = {
      x: this.target.x - this.pos.x,
      y: this.target.y - this.pos.y,
    };

    const magnitude = Math.sqrt(towardsTarget.x * towardsTarget.x + towardsTarget.y * towardsTarget.y);
    if (magnitude > 0) {
      towardsTarget.x = (towardsTarget.x / magnitude) * this.maxSpeed * proximityMult;
      towardsTarget.y = (towardsTarget.y / magnitude) * this.maxSpeed * proximityMult;
    }

    const steer = {
      x: towardsTarget.x - this.vel.x,
      y: towardsTarget.y - this.vel.y,
    };

    const steerMagnitude = Math.sqrt(steer.x * steer.x + steer.y * steer.y);
    if (steerMagnitude > 0) {
      steer.x = (steer.x / steerMagnitude) * this.maxForce;
      steer.y = (steer.y / steerMagnitude) * this.maxForce;
    }

    this.acc.x += steer.x;
    this.acc.y += steer.y;

    this.vel.x += this.acc.x;
    this.vel.y += this.acc.y;
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
    this.acc.x = 0;
    this.acc.y = 0;
  }

  draw(ctx: CanvasRenderingContext2D, drawAsPoints: boolean) {
    if (this.colorWeight < 1.0) {
      this.colorWeight = Math.min(this.colorWeight + this.colorBlendRate, 1.0);
    }

    const currentColor = {
      r: Math.round(this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight),
      g: Math.round(this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight),
      b: Math.round(this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight),
    };

    ctx.fillStyle = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`;

    if (drawAsPoints) {
      ctx.fillRect(this.pos.x, this.pos.y, 2, 2);
      return;
    }

    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.particleSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  kill(width: number, height: number) {
    if (!this.isKilled) {
      const randomPos = this.generateRandomPos(width / 2, height / 2, (width + height) / 2);
      this.target.x = randomPos.x;
      this.target.y = randomPos.y;

      this.startColor = {
        r: this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight,
        g: this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight,
        b: this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight,
      };
      this.targetColor = { r: 0, g: 0, b: 0 };
      this.colorWeight = 0;

      this.isKilled = true;
    }
  }

  private generateRandomPos(x: number, y: number, mag: number): Vector2D {
    const randomX = Math.random() * 1000;
    const randomY = Math.random() * 500;

    const direction = {
      x: randomX - x,
      y: randomY - y,
    };

    const magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    if (magnitude > 0) {
      direction.x = (direction.x / magnitude) * mag;
      direction.y = (direction.y / magnitude) * mag;
    }

    return {
      x: x + direction.x,
      y: y + direction.y,
    };
  }
}

interface ParticleTextEffectProps {
  words?: string[];
  width?: number;
  height?: number;
  className?: string;
  canvasClassName?: string;
  showHelperText?: boolean;
  fontSize?: number;
  fontFamily?: string;
  backgroundFill?: string;
  drawAsPoints?: boolean;
  autoAdvanceFrames?: number;
}

const DEFAULT_WORDS = ["HELLO", "21st.dev", "ParticleTextEffect", "BY", "KAINXU"];

export function ParticleTextEffect({
  words = DEFAULT_WORDS,
  width = 1000,
  height = 500,
  className,
  canvasClassName,
  showHelperText = true,
  fontSize,
  fontFamily = "Arial",
  backgroundFill = "rgba(0, 0, 0, 0.1)",
  drawAsPoints = true,
  autoAdvanceFrames = 240,
}: ParticleTextEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameCountRef = useRef(0);
  const wordIndexRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0, isPressed: false, isRightClick: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || words.length === 0) {
      return;
    }

    const pixelSteps = 6;
    const particles = particlesRef.current;
    particles.length = 0;
    frameCountRef.current = 0;
    wordIndexRef.current = 0;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const generateRandomPos = (x: number, y: number, mag: number): Vector2D => {
      const randomX = Math.random() * 1000;
      const randomY = Math.random() * 500;

      const direction = {
        x: randomX - x,
        y: randomY - y,
      };

      const magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
      if (magnitude > 0) {
        direction.x = (direction.x / magnitude) * mag;
        direction.y = (direction.y / magnitude) * mag;
      }

      return {
        x: x + direction.x,
        y: y + direction.y,
      };
    };

    const resolveFont = (word: string) => {
      const fittedSize =
        fontSize ?? Math.max(22, Math.min(height * 0.58, width / Math.max(word.length * 0.58, 1)));

      return `800 ${Math.floor(fittedSize)}px ${fontFamily}`;
    };

    const nextWord = (word: string) => {
      const offscreenCanvas = document.createElement("canvas");
      offscreenCanvas.width = canvas.width;
      offscreenCanvas.height = canvas.height;
      const offscreenCtx = offscreenCanvas.getContext("2d");

      if (!offscreenCtx) {
        return;
      }

      offscreenCtx.clearRect(0, 0, canvas.width, canvas.height);
      offscreenCtx.fillStyle = "white";
      offscreenCtx.font = resolveFont(word);
      offscreenCtx.textAlign = "center";
      offscreenCtx.textBaseline = "middle";
      offscreenCtx.fillText(word, canvas.width / 2, canvas.height / 2);

      const imageData = offscreenCtx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      const newColor = {
        r: Math.random() * 255,
        g: Math.random() * 255,
        b: Math.random() * 255,
      };

      let particleIndex = 0;
      const coordsIndexes: number[] = [];

      for (let i = 0; i < pixels.length; i += pixelSteps * 4) {
        coordsIndexes.push(i);
      }

      for (let i = coordsIndexes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [coordsIndexes[i], coordsIndexes[j]] = [coordsIndexes[j], coordsIndexes[i]];
      }

      for (const coordIndex of coordsIndexes) {
        const alpha = pixels[coordIndex + 3];

        if (alpha > 0) {
          const x = (coordIndex / 4) % canvas.width;
          const y = Math.floor(coordIndex / 4 / canvas.width);

          let particle: Particle;

          if (particleIndex < particles.length) {
            particle = particles[particleIndex];
            particle.isKilled = false;
            particleIndex++;
          } else {
            particle = new Particle();

            const randomPos = generateRandomPos(canvas.width / 2, canvas.height / 2, (canvas.width + canvas.height) / 2);
            particle.pos.x = randomPos.x;
            particle.pos.y = randomPos.y;

            particle.maxSpeed = Math.random() * 6 + 4;
            particle.maxForce = particle.maxSpeed * 0.05;
            particle.particleSize = Math.random() * 6 + 6;
            particle.colorBlendRate = Math.random() * 0.0275 + 0.0025;

            particles.push(particle);
          }

          particle.startColor = {
            r: particle.startColor.r + (particle.targetColor.r - particle.startColor.r) * particle.colorWeight,
            g: particle.startColor.g + (particle.targetColor.g - particle.startColor.g) * particle.colorWeight,
            b: particle.startColor.b + (particle.targetColor.b - particle.startColor.b) * particle.colorWeight,
          };
          particle.targetColor = newColor;
          particle.colorWeight = 0;

          particle.target.x = x;
          particle.target.y = y;
        }
      }

      for (let i = particleIndex; i < particles.length; i++) {
        particles[i].kill(canvas.width, canvas.height);
      }
    };

    const animate = () => {
      ctx.fillStyle = backgroundFill;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.move();
        particle.draw(ctx, drawAsPoints);

        if (
          particle.isKilled &&
          (particle.pos.x < 0 || particle.pos.x > canvas.width || particle.pos.y < 0 || particle.pos.y > canvas.height)
        ) {
          particles.splice(i, 1);
        }
      }

      if (mouseRef.current.isPressed && mouseRef.current.isRightClick) {
        particles.forEach((particle) => {
          const distance = Math.sqrt(
            Math.pow(particle.pos.x - mouseRef.current.x, 2) + Math.pow(particle.pos.y - mouseRef.current.y, 2),
          );
          if (distance < 50) {
            particle.kill(canvas.width, canvas.height);
          }
        });
      }

      frameCountRef.current++;
      if (frameCountRef.current % autoAdvanceFrames === 0) {
        wordIndexRef.current = (wordIndexRef.current + 1) % words.length;
        nextWord(words[wordIndexRef.current]);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    const handleMouseDown = (event: MouseEvent) => {
      mouseRef.current.isPressed = true;
      mouseRef.current.isRightClick = event.button === 2;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
      mouseRef.current.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    };

    const handleMouseUp = () => {
      mouseRef.current.isPressed = false;
      mouseRef.current.isRightClick = false;
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
      mouseRef.current.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    nextWord(words[0]);
    animate();

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("contextmenu", handleContextMenu);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [autoAdvanceFrames, backgroundFill, drawAsPoints, fontFamily, fontSize, height, width, words]);

  return (
    <div className={cn("flex flex-col items-center justify-center min-h-screen bg-black p-4", className)}>
      <canvas
        ref={canvasRef}
        className={cn("border border-gray-800 rounded-lg shadow-2xl", canvasClassName)}
        style={{ maxWidth: "100%", height: "auto" }}
      />

      {showHelperText ? (
        <div className="mt-4 max-w-md text-center text-sm text-white">
          <p className="mb-2">Particle Text Effect</p>
          <p className="text-xs text-gray-400">
            Right-click and hold while moving mouse to destroy particles • Words change automatically every 4 seconds
          </p>
        </div>
      ) : null}
    </div>
  );
}
