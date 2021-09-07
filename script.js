let context;
let contextColorIndex;
let canvasWidth;
let canvasHeight;
let particles;
let particleRadiusScale;

let nearestHoliday;
let holidayIndex;

let cursorX;
let cursorY;
let doForceRender = true;

let lastCursorPosition;
let isRightMouseButtonHeld = false;

function isWithinBounds(coordiante) {
  return coordiante >= 0 && coordiante <= 1;
}

function getBoundValue(num) {
  return Math.max(Math.min(num, 1), 0);
}

function getCursorSpeed() {
  const rawSpeed = Math.hypot(
    (cursorX - lastCursorPosition.x) / canvasWidth,
    (cursorY - lastCursorPosition.y) / canvasHeight
  );

  return Math.min(rawSpeed, 0.02);
}

function tickMouseInteraction() {
  if (!document.hasFocus() || !lastCursorPosition) {
    return { doRender: false };
  }

  const cursorSpeed = getCursorSpeed();

  if (!isRightMouseButtonHeld && !cursorSpeed) {
    return { doRender: false };
  }

  const distanceThreshold = isRightMouseButtonHeld ? 300 : 150;

  let doRender = false;
  particles.forEach((particle) => {
    const xDiff = particle.x * canvasWidth - cursorX;
    const yDiff = particle.y * canvasHeight - cursorY;
    const distance = Math.hypot(xDiff, yDiff);
    if (distance < distanceThreshold) {
      let multiplier =
        ((isRightMouseButtonHeld ? -0.006 : 16 * cursorSpeed) *
          (distanceThreshold - distance)) /
        particle.radius ** 2;

      if (isRightMouseButtonHeld) {
        const speed = Math.hypot(xDiff * multiplier, yDiff * multiplier);
        const MIN_SPEED = 2;
        if (speed < MIN_SPEED) {
          multiplier *= MIN_SPEED / speed;
        }
      }

      particle.xVel += xDiff * multiplier;
      particle.yVel += yDiff * multiplier;

      doRender = true;
    }
  });

  return { doRender };
}

function tickParticleDimensionMovement(
  particle,
  dimension,
  canvasDimensionSize
) {
  const velocityPropertyName = `${dimension}Vel`;
  particle[dimension] += particle[velocityPropertyName] / canvasDimensionSize;

  if (!isWithinBounds(particle[dimension])) {
    particle[dimension] = getBoundValue(particle[dimension]);
    particle[velocityPropertyName] *= -1;
  }

  const DECELERATION_MULTIPLIER = 0.94;
  particle[velocityPropertyName] *= DECELERATION_MULTIPLIER;
}

function areParticlesMoving() {
  const VELOCITY_THRESHOLD = 0.01;
  return particles.some((particle) =>
    ['x', 'y'].some((x) => Math.abs(particle[`${x}Vel`]) >= VELOCITY_THRESHOLD)
  );
}

function renderParticles() {
  particleRadiusScale = Math.min(particleRadiusScale * 1.14, 1);

  context.clearRect(0, 0, canvasWidth, canvasHeight);
  particles.forEach((particle) => {
    if (contextColorIndex !== particle.colorIndex) {
      context.fillStyle = `#${nearestHoliday.colors[particle.colorIndex]}`;
      contextColorIndex = particle.colorIndex;
    }

    tickParticleDimensionMovement(particle, 'x', canvasWidth);
    tickParticleDimensionMovement(particle, 'y', canvasHeight);

    context.beginPath();
    context.arc(
      particle.x * canvasWidth,
      particle.y * canvasHeight,
      particle.radius * particleRadiusScale,
      Math.PI * 2,
      false
    );

    context.fill();
  });
}

function tick() {
  let doRender = doForceRender;
  if (doForceRender) {
    doForceRender = false;
  }

  const mouseInteractionResult = tickMouseInteraction();
  if (mouseInteractionResult.doRender) {
    doRender = true;
  }

  if (!doRender) {
    doRender = areParticlesMoving();
  }

  if (doRender) {
    renderParticles();
  }

  lastCursorPosition = {
    x: cursorX,
    y: cursorY,
  };

  requestAnimationFrame(tick);
}

function updateText() {
  countdown.innerHTML = `${nearestHoliday.name}<br>${dayjs().to(
    nearestHoliday.date
  )}`;
}

function getHolidayDate(holiday, year) {
  return dayjs([
    year,
    ...(holiday.dateFunc
      ? holiday.dateFunc(year)
      : [holiday.month, holiday.day]),
  ]);
}

function addDateProp(holiday) {
  const now = new Date();
  const year = now.getFullYear();

  let date = getHolidayDate(holiday, year);
  if (date < now) {
    date = getHolidayDate(holiday, year + 1);
  }

  return { ...holiday, date };
}

function updateNearestHoliday(index) {
  nearestHoliday =
    index === null
      ? holidays
          .map(addDateProp)
          .sort((holiday1, holiday2) => holiday1.date - holiday2.date)[0]
      : addDateProp(holidays[index]);
  holidayIndex =
    index ?? holidays.findIndex((x) => x.name === nearestHoliday.name);
}

function updateCanvasSize() {
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  context.globalAlpha = 0.76;
}

function getRandomDirection() {
  return Math.random() * 2 - 1;
}

function getRandomCoordinate() {
  return 0.5 + getRandomDirection() * 0.1;
}

function getRandomVelocity() {
  return getRandomDirection() * 3;
}

function reset() {
  contextColorIndex = null;

  particles = [];
  for (let i = 0; i < 3000; i++) {
    particles.push({
      x: getRandomCoordinate(),
      y: getRandomCoordinate(),
      xVel: getRandomVelocity(),
      yVel: getRandomVelocity(),
      radius: (1 / (1 + Math.E ** (getRandomDirection() * 3))) * 6 + 2,
      colorIndex: Math.floor(nearestHoliday.colors.length * Math.random()),
    });
  }

  particleRadiusScale = 0.5;

  updateText();
  doForceRender = true;
}

function getHolidayIndexFromUri() {
  const seperator = '?holiday=';
  const param = decodeURI(window.location.href)
    .split('&')
    .find((x) => x.includes(seperator));

  if (!param) {
    return null;
  }

  const paramValue = holidays.findIndex(
    (x) => x.name === param.split(seperator)[1]
  );

  return paramValue === -1 ? null : paramValue;
}

window.addEventListener('load', () => {
  dayjs.extend(dayjs_plugin_relativeTime);

  updateNearestHoliday(getHolidayIndexFromUri());
  updateText();

  context = canvas.getContext('2d');
  updateCanvasSize();

  reset();
  requestAnimationFrame(tick);
  setInterval(() => {
    if (nearestHoliday.date.valueOf() < Date.now()) {
      updateNearestHoliday(null);
      reset();
    }

    updateText();
  }, 1000);
});

window.addEventListener('resize', () => {
  updateCanvasSize();
  reset();
});

function isRightMouseButton(event) {
  return event.button === 2;
}

document.addEventListener('mousedown', (event) => {
  if (isRightMouseButton(event)) {
    isRightMouseButtonHeld = true;
  }
});

document.addEventListener('mouseup', (event) => {
  if (isRightMouseButton(event)) {
    isRightMouseButtonHeld = false;
  }
});

document.addEventListener('mousemove', (event) => {
  cursorX = event.clientX;
  cursorY = event.clientY;
});

document.addEventListener('contextmenu', (event) => event.preventDefault());

function wrapIndex(index, length) {
  return ((index % length) + length) % length;
}

document.addEventListener('keydown', (event) => {
  const { key } = event;
  const change = key === 'ArrowLeft' ? -1 : key === 'ArrowRight' ? 1 : null;
  if (change) {
    updateNearestHoliday(wrapIndex(holidayIndex + change, holidays.length));
    reset();
  }
});

window.addEventListener('blur', () => (lastMousePosition = null));
