(function () {
  var PROMPT = "junxibao@terminal:~$";
  var ROOT_ID = "terminal-content";

  var COMMAND_SEQUENCE = [
    {
      command: "whoami",
      outputs: [
        {
          key: "index.output.whoami",
          fallback: "Junxi Bao - High School Student & Tech Enthusiast"
        }
      ]
    },
    {
      command: "cat about.txt",
      batch: true,
      outputs: [
        {
          key: "index.output.about1",
          fallback: "Passionate about computer science, engineering, and smart home technology."
        },
        {
          key: "index.output.about2",
          fallback: "Currently studying at NINGBO HD School."
        }
      ]
    },
    {
      command: "ls projects/",
      outputs: [
        {
          key: "index.output.projects",
          fallback: "Smart Home Setup | Web Development | App Development | Raspberry Pi Projects"
        }
      ]
    },
    {
      command: "echo \"Ready to explore?\"",
      commandByLang: {
        en: "echo \"Ready to explore?\"",
        zh: "echo \"准备好探索了吗?\""
      },
      outputs: [
        {
          key: "index.output.ready",
          fallback: "Ready to explore?"
        }
      ]
    }
  ];

  var STEP_DELAY = {
    beforeCommand: 220,
    perChar: 65,
    perCharJitter: 45,
    afterCommand: 180,
    afterOutputLine: 300,
    betweenCommands: 420
  };

  var runToken = 0;
  var hasInitialized = false;
  var resizeTimer = null;

  function shouldReduceMotion() {
    try {
      return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      return false;
    }
  }

  function wait(ms, token) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve(token === runToken);
      }, Math.max(0, ms));
    });
  }

  function getTranslation(key, fallback) {
    if (window.LangManager && typeof window.LangManager.translate === "function") {
      var translated = window.LangManager.translate(key);
      if (translated !== null && translated !== undefined) {
        return translated;
      }
    }
    return fallback || "";
  }

  function getCurrentLang() {
    if (window.LangManager && typeof window.LangManager.get === "function") {
      return window.LangManager.get();
    }
    return "en";
  }

  function getCommandText(step) {
    if (!step) return "";
    if (!step.commandByLang) return step.command || "";
    var lang = getCurrentLang();
    return step.commandByLang[lang] || step.commandByLang.en || step.command || "";
  }

  function scrollToBottom(container) {
    container.scrollTop = container.scrollHeight;
  }

  function appendStaticCommandLine(container, text) {
    var line = document.createElement("div");
    line.className = "terminal-line terminal-command-line";

    var prompt = document.createElement("span");
    prompt.className = "prompt";
    prompt.textContent = PROMPT;

    var command = document.createElement("span");
    command.className = "command";
    command.textContent = text;

    line.appendChild(prompt);
    line.appendChild(command);
    container.appendChild(line);
  }

  function appendStaticOutputLine(container, text) {
    var line = document.createElement("div");
    line.className = "terminal-line terminal-output-line is-visible";

    var output = document.createElement("span");
    output.className = "output";
    output.textContent = text;

    line.appendChild(output);
    container.appendChild(line);
  }

  function measureFinalHeight(container) {
    var width = Math.ceil(container.getBoundingClientRect().width || container.clientWidth);
    if (!width) return null;

    var probe = document.createElement("div");
    probe.className = container.className;
    probe.style.position = "absolute";
    probe.style.left = "-99999px";
    probe.style.top = "0";
    probe.style.visibility = "hidden";
    probe.style.pointerEvents = "none";
    probe.style.width = width + "px";
    probe.style.height = "auto";
    probe.style.minHeight = "0";
    probe.style.maxHeight = "none";
    probe.style.overflow = "visible";

    document.body.appendChild(probe);

    for (var i = 0; i < COMMAND_SEQUENCE.length; i++) {
      var step = COMMAND_SEQUENCE[i];
      appendStaticCommandLine(probe, getCommandText(step));
      for (var j = 0; j < step.outputs.length; j++) {
        var outputItem = step.outputs[j];
        appendStaticOutputLine(probe, getTranslation(outputItem.key, outputItem.fallback));
      }
    }

    var measured = Math.ceil(probe.scrollHeight);
    probe.remove();
    return measured;
  }

  function lockContainerHeight(container) {
    var measured = measureFinalHeight(container);
    if (!measured) return;

    var minHeight = parseFloat(window.getComputedStyle(container).minHeight) || 0;
    var target = Math.max(measured, Math.ceil(minHeight));
    container.style.height = target + "px";
  }

  function createCommandLine(container) {
    var line = document.createElement("div");
    line.className = "terminal-line terminal-command-line";

    var prompt = document.createElement("span");
    prompt.className = "prompt";
    prompt.textContent = PROMPT;

    var command = document.createElement("span");
    command.className = "command";

    var caret = document.createElement("span");
    caret.className = "terminal-caret";
    caret.setAttribute("aria-hidden", "true");

    line.appendChild(prompt);
    line.appendChild(command);
    line.appendChild(caret);
    container.appendChild(line);

    scrollToBottom(container);
    return { command: command, caret: caret };
  }

  function createOutputLine(container, text, revealNow) {
    var line = document.createElement("div");
    line.className = "terminal-line terminal-output-line";

    var output = document.createElement("span");
    output.className = "output";
    output.textContent = text;

    line.appendChild(output);
    container.appendChild(line);
    scrollToBottom(container);

    if (revealNow) {
      line.classList.add("is-visible");
      return;
    }

    requestAnimationFrame(function () {
      line.classList.add("is-visible");
      scrollToBottom(container);
    });
  }

  async function typeCommand(commandEl, text, token, reducedMotion) {
    if (reducedMotion) {
      commandEl.textContent = text;
      return token === runToken;
    }

    for (var i = 0; i < text.length; i++) {
      if (token !== runToken) return false;
      commandEl.textContent += text.charAt(i);
      var jitter = Math.floor(Math.random() * STEP_DELAY.perCharJitter);
      var stillActive = await wait(STEP_DELAY.perChar + jitter, token);
      if (!stillActive) return false;
    }

    return token === runToken;
  }

  async function runTerminalSequence() {
    var container = document.getElementById(ROOT_ID);
    if (!container) return;

    var token = ++runToken;
    var reducedMotion = shouldReduceMotion();

    // Wait for fonts to load so the height measurement is accurate
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    if (token !== runToken) return;

    lockContainerHeight(container);
    container.innerHTML = "";

    for (var i = 0; i < COMMAND_SEQUENCE.length; i++) {
      var step = COMMAND_SEQUENCE[i];
      if (!(await wait(STEP_DELAY.beforeCommand, token))) return;

      var parts = createCommandLine(container);
      var typed = await typeCommand(parts.command, getCommandText(step), token, reducedMotion);
      if (!typed) return;
      parts.caret.remove();

      if (!(await wait(STEP_DELAY.afterCommand, token))) return;

      for (var j = 0; j < step.outputs.length; j++) {
        var outputItem = step.outputs[j];
        var outputText = getTranslation(outputItem.key, outputItem.fallback);
        createOutputLine(container, outputText, step.batch || reducedMotion);
        if (!step.batch) {
          if (!(await wait(STEP_DELAY.afterOutputLine, token))) return;
        }
      }
      if (step.batch) {
        if (!(await wait(STEP_DELAY.afterOutputLine, token))) return;
      }

      if (!(await wait(STEP_DELAY.betweenCommands, token))) return;
    }
  }

  function initTerminalTyping() {
    if (hasInitialized) return;
    hasInitialized = true;

    runTerminalSequence();
    window.addEventListener("langchange", runTerminalSequence);
    window.addEventListener("resize", function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var container = document.getElementById(ROOT_ID);
        if (!container) return;
        lockContainerHeight(container);
        scrollToBottom(container);
      }, 120);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTerminalTyping, { once: true });
  } else {
    initTerminalTyping();
  }
})();
