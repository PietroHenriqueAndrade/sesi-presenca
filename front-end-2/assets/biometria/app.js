const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const cameraStage = document.getElementById('cameraStage');
const cameraShade = document.getElementById('cameraShade');
const shadeIcon = document.getElementById('shadeIcon');
const shadeTitle = document.getElementById('shadeTitle');
const shadeText = document.getElementById('shadeText');
const btnRecognize = document.getElementById('btnRecognize');
const buttonText = document.getElementById('buttonText');
const instructionTitle = document.getElementById('instructionTitle');
const instructionText = document.getElementById('instructionText');
const serviceStatus = document.getElementById('serviceStatus');
const operatorName = document.getElementById('operatorName');
const apiInfo = document.getElementById('apiInfo');
const btnLogout = document.getElementById('btnLogout');
const toast = document.getElementById('toast');
const toastTitle = document.getElementById('toastTitle');
const toastText = document.getElementById('toastText');
const secondFactorModal = document.getElementById('secondFactorModal');
const secondFactorCode = document.getElementById('secondFactorCode');
const secondFactorError = document.getElementById('secondFactorError');
const btnConfirmSecondFactor = document.getElementById('btnConfirmSecondFactor');
const btnCancelSecondFactor = document.getElementById('btnCancelSecondFactor');

let stream = null;
let cameraStartPromise = null;
let busy = false;
let challengeToken = null;
let toastTimer = null;

function getRuntimeConfig() {
  return window.__TCC_CONFIG__ || {};
}

function getConfig(key, fallback = '') {
  return localStorage.getItem(key) || fallback;
}

function getToken() {
  return getRuntimeConfig().token || getConfig('token');
}

function getScheme() {
  return getConfig('tcc_server_scheme', 'http');
}

function getIp() {
  return getConfig('tcc_server_ip', '10.0.2.2');
}

function getNodeApi() {
  const runtime = getRuntimeConfig().nodeApiBase;
  if (runtime) return String(runtime).replace(/\/$/, '');
  return `${getScheme()}://${getIp()}:${getConfig(
    'tcc_node_port',
    '3000'
  )}/api/v1`;
}

function getPythonApi() {
  const runtime = getRuntimeConfig().pythonApiBase;
  if (runtime) return String(runtime).replace(/\/$/, '');
  return `${getScheme()}://${getIp()}:${getConfig(
    'tcc_python_port',
    '5000'
  )}`;
}

function getOperatorName() {
  return getRuntimeConfig().userName || getConfig('tcc_user_name', 'Operador autorizado');
}

function notifyFlutter(evento, payload = {}) {
  try {
    if (window.FlutterBiometria?.postMessage) {
      window.FlutterBiometria.postMessage(
        JSON.stringify({
          evento,
          ...payload,
        })
      );
    }
  } catch (error) {
    console.warn('Falha ao notificar Flutter', error);
  }
}

function setServiceState(ok, text) {
  serviceStatus.classList.toggle('error', !ok);
  serviceStatus.querySelector('span').textContent = text;
}

function setInstruction(title, text) {
  instructionTitle.textContent = title;
  instructionText.textContent = text;
}

function showToast(title, text, timeout = 3600) {
  clearTimeout(toastTimer);

  toastTitle.textContent = title;
  toastText.textContent = text;
  toast.classList.remove('hidden');

  toastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, timeout);
}

function showShade({ ok = true, title, text }) {
  shadeIcon.textContent = ok ? '✓' : '!';
  shadeIcon.style.background = ok ? '#e9f7ef' : '#ffeaec';
  shadeIcon.style.color = ok ? '#16834a' : '#e30613';

  shadeTitle.textContent = title;
  shadeText.textContent = text;

  cameraShade.classList.add('visible');
  cameraStage.classList.toggle('success', ok);
}

function clearShade() {
  cameraShade.classList.remove('visible');
  cameraStage.classList.remove('success');
}

/* ============================================================
   CÂMERA
   ============================================================ */

async function startCamera() {
  /*
    Se a câmera já estiver funcionando e o vídeo já estiver
    usando esse mesmo stream, não tenta abrir tudo novamente.
  */
  if (stream?.active && video.srcObject === stream) {
    setServiceState(true, 'Câmera pronta');
    return;
  }

  /*
    O Flutter pode chamar startCamera() pelo evento
    flutter-config-updated enquanto o fallback também chama
    startCamera() quase ao mesmo tempo.

    Esta Promise impede duas inicializações simultâneas.
  */
  if (cameraStartPromise) {
    return cameraStartPromise;
  }

  cameraStartPromise = (async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          'Este dispositivo não oferece acesso à câmera pelo navegador.'
        );
      }

      const novoStream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: {
              ideal: 1280,
            },
            height: {
              ideal: 720,
            },
          },
          audio: false,
        });

      /*
        Se existia um stream antigo diferente, encerra
        somente depois que a nova câmera abriu.
      */
      if (stream && stream !== novoStream) {
        stream
          .getTracks()
          .forEach((track) => track.stop());
      }

      stream = novoStream;

      /*
        Só altera srcObject se realmente for necessário.
        Isso evita novas cargas desnecessárias no <video>.
      */
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }

      /*
        No Android WebView/Chromium pode ocorrer:

        The play() request was interrupted by a new load request

        Se o stream continua ativo, esse erro não significa
        que a câmera está indisponível.
      */
      try {
        await video.play();
      } catch (error) {
        const cameraContinuaAtiva =
          error?.name === 'AbortError' &&
          stream?.active &&
          video.srcObject === stream;

        if (!cameraContinuaAtiva) {
          throw error;
        }

        console.warn(
          'video.play() interrompido durante a inicialização; stream permanece ativo.',
          error
        );
      }

      setServiceState(true, 'Câmera pronta');

      setInstruction(
        'Posicione seu rosto no centro',
        'Olhe para a câmera, mantenha o rosto visível e evite contraluz.'
      );
    } catch (error) {
      console.error(
        'Falha ao iniciar câmera:',
        error
      );

      /*
        Só exibe "Câmera indisponível" se realmente
        não existir nenhum stream ativo.
      */
      if (
        !(
          stream?.active &&
          video.srcObject === stream
        )
      ) {
        setServiceState(
          false,
          'Câmera indisponível'
        );

        setInstruction(
          'Não foi possível abrir a câmera',
          'Confira a permissão do aplicativo e tente novamente.'
        );

        showToast(
          'Câmera indisponível',
          error?.message ||
            'Permissão ou dispositivo de câmera indisponível.'
        );
      }
    } finally {
      cameraStartPromise = null;
    }
  })();

  return cameraStartPromise;
}

/* ============================================================
   CAPTURA DA FOTO
   ============================================================ */

function captureJpeg() {
  if (
    !video.videoWidth ||
    !video.videoHeight
  ) {
    throw new Error(
      'A câmera ainda não está pronta.'
    );
  }

  // Reduz um pouco a resolução.
  // Continua suficiente para reconhecimento,
  // mas envia menos dados e o dlib trabalha menos.
  const maxWidth = 1024;

  const scale = Math.min(
    1,
    maxWidth / video.videoWidth
  );

  canvas.width = Math.round(
    video.videoWidth * scale
  );

  canvas.height = Math.round(
    video.videoHeight * scale
  );

  const ctx = canvas.getContext(
    '2d',
    {
      alpha: false,
    }
  );

  ctx.drawImage(
    video,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise(
    (resolve, reject) => {

      canvas.toBlob(
        (blob) => {

          if (blob) {
            resolve(blob);
          } else {
            reject(
              new Error(
                'Falha ao capturar imagem.'
              )
            );
          }

        },

        'image/jpeg',

        0.88
      );

    }
  );
}

/* ============================================================
   RESPOSTA DAS APIS
   ============================================================ */

async function parseResponse(response) {
  const text =
    await response.text();

  let payload = {};

  try {
    payload = text
      ? JSON.parse(text)
      : {};
  } catch {
    payload = {
      mensagem: text,
    };
  }

  if (!response.ok) {
    const message =
      payload.detail ||
      payload.mensagem ||
      payload.message ||
      `Erro HTTP ${response.status}`;

    const error =
      new Error(message);

    error.status =
      response.status;

    error.payload =
      payload;

    throw error;
  }

  return payload;
}

/* ============================================================
   SESSÃO
   ============================================================ */

function ensureSession() {
  const token = getToken();

  if (!token) {
    notifyFlutter(
      'sessao_expirada'
    );

    throw new Error(
      'Sessão expirada. Faça login novamente.'
    );
  }

  return token;
}

/* ============================================================
   RECONHECIMENTO
   ============================================================ */

async function recognize() {
  if (busy) {
    return;
  }

  busy = true;

  btnRecognize.disabled = true;

  cameraStage.classList.add(
    'scanning'
  );

  clearShade();

  buttonText.textContent =
    'Analisando...';

  setInstruction(
    'Analisando identidade',
    'Aguarde alguns instantes e permaneça olhando para a câmera.'
  );

  try {
    const token =
      ensureSession();

    const blob =
      await captureJpeg();

    const form =
      new FormData();

    form.append(
      'file',
      blob,
      'presenca.jpg'
    );

    const response =
      await fetch(
        `${getPythonApi()}/reconhecer`,
        {
          method: 'POST',
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
          body: form,
        }
      );

    const data =
      await parseResponse(
        response
      );

    if (
      data.status ===
      'verificacao_adicional'
    ) {
      challengeToken =
        data.desafio;

      setInstruction(
        'Verificação adicional necessária',
        'O sistema encontrou rostos muito semelhantes e não vai escolher uma identidade automaticamente.'
      );

      showToast(
        'Proteção contra falso reconhecimento',
        'Digite o código pessoal para concluir a identificação.',
        5000
      );

      openSecondFactor();

      return;
    }

    if (
      data.status ===
        'sucesso' &&
      data.reconhecido === true
    ) {
      await handleSuccess(data);

      return;
    }

    const msg =
      data.mensagem ||
      'Não foi possível identificar com segurança.';

    showShade({
      ok: false,
      title: 'Não identificado',
      text: msg,
    });

    setInstruction(
      'Tente novamente',
      'Ajuste a posição, retire objetos que cubram o rosto e melhore a iluminação.'
    );

    showToast(
      'Reconhecimento não confirmado',
      msg
    );

    setTimeout(
      clearShade,
      2200
    );
  } catch (error) {
    console.error(error);

    if (
      error.status === 401
    ) {
      notifyFlutter(
        'sessao_expirada'
      );
    }

    showShade({
      ok: false,
      title:
        'Não foi possível processar',
      text:
        error.message ||
        'Falha inesperada.',
    });

    setInstruction(
      'Serviço temporariamente indisponível',
      'Confira a conexão do terminal e tente novamente.'
    );

    showToast(
      'Erro no reconhecimento',
      error.message ||
        'Falha inesperada.'
    );

    setTimeout(
      clearShade,
      2600
    );
  } finally {
    cameraStage.classList.remove(
      'scanning'
    );

    buttonText.textContent =
      'Registrar presença';

    btnRecognize.disabled =
      false;

    busy = false;
  }
}

/* ============================================================
   SUCESSO
   ============================================================ */

async function handleSuccess(
  data
) {
  const nome =
    data.aluno ||
    'Aluno identificado';

  const mensagem =
    data.mensagem ||
    'Presença processada com sucesso.';

  showShade({
    ok: true,
    title: nome,
    text: mensagem,
  });

  setInstruction(
    'Presença processada',
    'O terminal ficará pronto automaticamente para a próxima pessoa.'
  );

  showToast(
    'Identidade confirmada',
    `${nome} • ${mensagem}`,
    4500
  );

  notifyFlutter(
    'presenca_processada',
    {
      registrada:
        data.presenca_registrada ===
        true,

      aluno: nome,

      eventoBackend:
        data.evento || null,
    }
  );

  /*
    Não fecha a WebView.
    O terminal continua pronto para o próximo aluno.
  */

  await new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        1800
      )
  );

  clearShade();

  setInstruction(
    'Posicione seu rosto no centro',
    'Olhe para a câmera, mantenha o rosto visível e evite contraluz.'
  );
}

/* ============================================================
   SEGUNDO FATOR
   ============================================================ */

function openSecondFactor() {
  secondFactorCode.value = '';

  secondFactorError.classList.add(
    'hidden'
  );

  secondFactorError.textContent = '';

  secondFactorModal.classList.remove(
    'hidden'
  );

  setTimeout(() => {
    secondFactorCode.focus();
  }, 80);
}

function closeSecondFactor() {
  secondFactorModal.classList.add(
    'hidden'
  );

  challengeToken = null;
}

async function confirmSecondFactor() {
  const code =
    secondFactorCode.value
      .replace(/\D/g, '')
      .slice(0, 6);

  if (
    code.length !== 6 ||
    !challengeToken
  ) {
    secondFactorError.textContent =
      'Informe os 6 dígitos do seu código pessoal.';

    secondFactorError.classList.remove(
      'hidden'
    );

    return;
  }

  btnConfirmSecondFactor.disabled =
    true;

  secondFactorError.classList.add(
    'hidden'
  );

  try {
    const token =
      ensureSession();

    const response =
      await fetch(
        `${getPythonApi()}/confirmar-ambiguidade`,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${token}`,

            'Content-Type':
              'application/json',

            Accept:
              'application/json',
          },

          body: JSON.stringify({
            desafio:
              challengeToken,

            codigo: code,
          }),
        }
      );

    const data =
      await parseResponse(
        response
      );

    closeSecondFactor();

    if (
      data.status ===
        'sucesso' &&
      data.reconhecido === true
    ) {
      await handleSuccess(
        data
      );
    } else {
      throw new Error(
        data.mensagem ||
          'Código não confirmou nenhuma identidade.'
      );
    }
  } catch (error) {
    secondFactorError.textContent =
      error.message ||
      'Não foi possível confirmar o código.';

    secondFactorError.classList.remove(
      'hidden'
    );
  } finally {
    btnConfirmSecondFactor.disabled =
      false;
  }
}

/* ============================================================
   HEALTH CHECK
   ============================================================ */

async function healthCheck() {
  try {
    const nodeHost = new URL(getNodeApi(), window.location.href).host;
    const pythonHost = new URL(getPythonApi(), window.location.href).host;
    apiInfo.textContent = `Node ${nodeHost} • IA ${pythonHost}`;
  } catch {
    apiInfo.textContent = 'Serviços configurados';
  }

  try {
    // O readiness do Python também verifica se o Backend Node está alcançável.
    const response = await fetch(`${getPythonApi()}/health/ready`, { cache: 'no-store' });
    setServiceState(response.ok, response.ok ? 'Sistema pronto' : 'Serviço parcial');
  } catch {
    setServiceState(false, 'Conexão limitada');
  }
}

/* ============================================================
   EVENTOS
   ============================================================ */

btnRecognize.addEventListener(
  'click',
  recognize
);

btnConfirmSecondFactor.addEventListener(
  'click',
  confirmSecondFactor
);

btnCancelSecondFactor.addEventListener(
  'click',
  () => {
    closeSecondFactor();

    setInstruction(
      'Reconhecimento cancelado',
      'Reposicione o rosto para tentar novamente ou procure a secretaria.'
    );
  }
);

secondFactorCode.addEventListener(
  'input',
  () => {
    secondFactorCode.value =
      secondFactorCode.value
        .replace(/\D/g, '')
        .slice(0, 6);
  }
);

secondFactorCode.addEventListener(
  'keydown',
  (event) => {
    if (
      event.key === 'Enter'
    ) {
      confirmSecondFactor();
    }
  }
);

btnLogout.addEventListener(
  'click',
  () =>
    notifyFlutter(
      'logout_solicitado'
    )
);

/*
  O Flutter envia as configurações para o JavaScript.
*/
window.addEventListener(
  'flutter-config-updated',
  () => {
    const operator =
      getOperatorName();

    operatorName.textContent =
      operator;

    healthCheck();

    startCamera();
  }
);

/*
  Fecha os tracks da câmera ao sair da página.
*/
window.addEventListener(
  'beforeunload',
  () => {
    stream
      ?.getTracks()
      .forEach(
        (track) =>
          track.stop()
      );
  }
);

/*
  Fallback para navegador/Python local.

  Se flutter-config-updated já iniciou a câmera,
  startCamera() reutiliza a mesma inicialização
  e não cria outro video.play() concorrente.
*/
setTimeout(() => {
  operatorName.textContent =
    getConfig(
      'tcc_user_name',
      'Operador autorizado'
    );

  healthCheck();

  startCamera();
}, 500);