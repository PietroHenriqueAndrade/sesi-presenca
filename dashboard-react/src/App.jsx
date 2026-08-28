import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_URL, PYTHON_API_URL, ApiError, api, getData, login, logout } from './lib/api';
import { clearSession, readSession, saveSession } from './lib/session';

const STATUS_LABEL = {
  PRESENTE: 'Presente', AUSENTE: 'Ausente', JUSTIFICADO: 'Justificado', ATRASO: 'Atraso',
  SAIDA_ANTECIPADA: 'Saída antecipada', PENDENTE: 'Pendente', APROVADO: 'Aprovado', REJEITADO: 'Rejeitado',
};
const ROLE_LABEL = { ADMIN: 'Administrador', SECRETARIA: 'Secretaria', PROFESSOR: 'Professor', COZINHA: 'Cozinha', SISTEMA_IA: 'Sistema IA' };

function todaySP() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const m = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${m.year}-${m.month}-${m.day}`;
}
function formatDate(value) {
  if (!value) return '—';
  const raw = String(value); const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T12:00:00` : raw);
  return Number.isNaN(date.getTime()) ? raw : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
}
function formatDateTime(value) {
  if (!value) return '—'; const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(d);
}
function rows(value) { return Array.isArray(value) ? value : Array.isArray(value?.dados) ? value.dados : []; }
function escapeCsv(value) { const s = String(value ?? ''); return `"${s.replaceAll('"', '""')}"`; }

function Brand({ compact = false }) {
  return <div className={`brand ${compact ? 'brand-compact' : ''}`}><img src="/sesi-logo.png" alt="SESI" /><div><strong>Presença Inteligente</strong><span>Gestão escolar</span></div></div>;
}
function StatusBadge({ value }) { const v = String(value || '—').toUpperCase(); return <span className={`status status-${v.toLowerCase()}`}>{STATUS_LABEL[v] || v}</span>; }
function Loading({ text = 'Carregando dados...' }) { return <div className="state-box"><span className="spinner" /><strong>{text}</strong></div>; }
function Empty({ children = 'Nenhum registro encontrado.' }) { return <div className="state-box">{children}</div>; }
function ErrorBox({ error, onRetry }) { return <div className="state-box state-error"><strong>Não foi possível carregar esta área.</strong><span>{error?.message || String(error)}</span>{onRetry && <button className="button secondary" onClick={onRetry}>Tentar novamente</button>}</div>; }
function PageHeader({ title, description, actions }) { return <div className="page-header"><div><span className="eyebrow">SESI • SISTEMA DE PRESENÇA</span><h1>{title}</h1><p>{description}</p></div>{actions && <div className="page-actions">{actions}</div>}</div>; }
function Metric({ title, value, hint, tone = '' }) { return <article className={`metric-card ${tone}`}><span>{title}</span><strong>{value}</strong><small>{hint}</small></article>; }
function DataTable({ columns, children }) { return <div className="table-wrap"><table><thead><tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr></thead><tbody>{children}</tbody></table></div>; }

function useLoad(loader, deps = []) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const run = useCallback(async () => {
    setState((old) => ({ ...old, loading: true, error: null }));
    try { setState({ loading: false, data: await loader(), error: null }); }
    catch (error) { setState({ loading: false, data: null, error }); }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, [run]);
  return { ...state, reload: run };
}

function Login({ onSuccess }) {
  const [email, setEmail] = useState(''); const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const user = await login(email.trim(), senha);
      if (user?.role === 'SISTEMA_IA') { await logout(); throw new ApiError('Conta de serviço não pode acessar o Dashboard.'); }
      onSuccess(user);
    } catch (err) { setError(err.message || 'Falha ao entrar.'); } finally { setLoading(false); }
  }
  return <main className="login-page">
    <section className="login-brand-panel">
      <Brand />
      <div className="login-copy"><span className="eyebrow light">CONTROLE DE PRESENÇA ESCOLAR</span><h1>Biometria com gestão centralizada e rastreável.</h1><p>Administração, relatórios, cadastro biométrico protegido e acompanhamento de frequência no padrão visual SESI.</p></div>
      <div className="architecture-strip"><span>Flutter</span><b>→</b><span>Node.js</span><b>→</b><span>Python IA</span><b>→</b><span>PostgreSQL</span></div>
    </section>
    <section className="login-form-panel"><form className="login-card" onSubmit={submit}>
      <img className="login-logo-mobile" src="/sesi-logo.png" alt="SESI" />
      <div><span className="eyebrow">ACESSO ADMINISTRATIVO</span><h2>Entrar no Dashboard</h2><p>Use sua conta cadastrada no Backend.</p></div>
      <label>E-mail<input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@sesi.br" /></label>
      <label>Senha<input type="password" required minLength={8} autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" /></label>
      {error && <div className="inline-error">{error}</div>}
      <button className="button primary block" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
      <small>Backend: {API_URL}</small>
    </form></section>
  </main>;
}

function DashboardPage() {
  const r = useLoad(async () => getData(await api('/dashboard/resumo'), {}), []);
  if (r.loading) return <Loading />; if (r.error) return <ErrorBox error={r.error} onRetry={r.reload} />;
  const d = r.data || {}, hoje = d.hoje || {}, status = hoje.porStatus || {}, cad = d.cadastros || {}, pend = d.pendencias || {}, serie = d.ultimos7Dias || [], recentes = d.presencasRecentes || [];
  const max = Math.max(1, ...serie.map((x) => Number(x.total) || 0));
  return <>
    <PageHeader title="Visão geral" description={`Indicadores consolidados pelo Backend • ${formatDateTime(d.geradoEm)}`} actions={<button className="button secondary" onClick={r.reload}>Atualizar</button>} />
    <div className="metrics"><Metric title="Alunos ativos" value={cad.alunosAtivos ?? 0} hint={`${cad.turmasAtivas ?? 0} turma(s)`} /><Metric title="Comparecimentos hoje" value={hoje.comparecimentos ?? 0} hint={`${hoje.totalRegistros ?? 0} registros`} tone="good" /><Metric title="Ausências hoje" value={hoje.ausencias ?? 0} hint={`${status.JUSTIFICADO ?? 0} justificadas`} tone="danger" /><Metric title="Pendências" value={(pend.justificativas ?? 0) + (pend.alertas ?? 0)} hint="Justificativas + alertas" tone="warn" /></div>
    <div className="dashboard-grid"><section className="panel"><div className="panel-head"><div><h2>Movimento dos últimos 7 dias</h2><p>Volume de registros recebidos</p></div></div><div className="bar-chart">{serie.map((x) => <div className="bar-col" key={x.data}><span>{x.total || 0}</span><div className="bar-track"><i style={{ height: `${Math.max(4, ((x.total || 0) / max) * 100)}%` }} /></div><small>{new Date(`${x.data}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</small></div>)}</div></section>
    <section className="panel"><div className="panel-head"><div><h2>Status de hoje</h2><p>Distribuição atual</p></div></div><div className="status-list">{['PRESENTE','ATRASO','SAIDA_ANTECIPADA','AUSENTE','JUSTIFICADO'].map((k) => <div key={k}><StatusBadge value={k}/><strong>{status[k] ?? 0}</strong></div>)}</div></section></div>
    <section className="panel"><div className="panel-head"><div><h2>Presenças recentes</h2><p>Últimos eventos registrados</p></div></div><DataTable columns={['Aluno','Matrícula','Turma','Horário','Status']}>{recentes.map((p) => <tr key={p.id}><td><strong>{p.aluno?.nome || '—'}</strong></td><td>{p.aluno?.matricula || '—'}</td><td>{p.turma?.nome || '—'}</td><td>{formatDateTime(p.dataHora)}</td><td><StatusBadge value={p.status}/></td></tr>)}</DataTable>{!recentes.length && <Empty />}</section>
  </>;
}

function AlunosPage() {
  const [busca, setBusca] = useState('');
  const r = useLoad(async () => getData(await api(`/alunos?${new URLSearchParams({ page:'1', limit:'100', ...(busca.trim()?{busca:busca.trim()}:{}) })}`), {}), [busca]);
  return <><PageHeader title="Alunos" description="Cadastros ativos, matrículas e vínculos de turma." actions={<input className="search" value={busca} onChange={(e)=>setBusca(e.target.value)} placeholder="Buscar aluno ou matrícula"/>}/>{r.loading?<Loading/>:r.error?<ErrorBox error={r.error} onRetry={r.reload}/>:<section className="panel"><DataTable columns={['Aluno','Matrícula','Turma','Biometria']}>{rows(r.data).map((a)=><tr key={a.id}><td><strong>{a.nome}</strong></td><td>{a.matricula}</td><td>{a.turmas?.[0]?.turma?.nome || 'Sem turma'}</td><td>{a.fotoTreinamento?<span className="dot-label ok"><i/>Cadastrada</span>:<span className="dot-label"><i/>Pendente</span>}</td></tr>)}</DataTable>{!rows(r.data).length&&<Empty/>}</section>}</>;
}

function PresencasPage() {
  const [data, setData] = useState(todaySP()); const [status, setStatus] = useState('');
  const r = useLoad(async () => {
    const q = new URLSearchParams({ page:'1', limit:'100', dataInicio:data, dataFim:data }); if(status) q.set('status',status);
    return getData(await api(`/presencas?${q}`), {});
  }, [data,status]);
  const lista = rows(r.data);
  function exportCsv(){
    const lines=[['Aluno','Matricula','Turma','Entrada','Saida','Status'],...lista.map(p=>[p.aluno?.nome,p.aluno?.matricula,p.turma?.nome,p.dataHora,p.dataHoraSaida,p.status])].map(row=>row.map(escapeCsv).join(';')).join('\n');
    const url=URL.createObjectURL(new Blob(['\ufeff'+lines],{type:'text/csv;charset=utf-8'})); const a=document.createElement('a'); a.href=url;a.download=`presencas-${data}.csv`;a.click();URL.revokeObjectURL(url);
  }
  return <><PageHeader title="Presenças" description="Consulta diária com filtro e exportação CSV." actions={<><input type="date" value={data} onChange={(e)=>setData(e.target.value)}/><select value={status} onChange={(e)=>setStatus(e.target.value)}><option value="">Todos</option>{['PRESENTE','ATRASO','SAIDA_ANTECIPADA','AUSENTE','JUSTIFICADO'].map(x=><option key={x}>{x}</option>)}</select><button className="button secondary" onClick={exportCsv} disabled={!lista.length}>Exportar CSV</button></>}/>{r.loading?<Loading/>:r.error?<ErrorBox error={r.error} onRetry={r.reload}/>:<section className="panel"><DataTable columns={['Aluno','Turma','Entrada','Saída','Status','Origem']}>{lista.map(p=><tr key={p.id}><td><strong>{p.aluno?.nome||'—'}</strong><small className="cell-sub">{p.aluno?.matricula||''}</small></td><td>{p.turma?.nome||'—'}</td><td>{formatDateTime(p.dataHora)}</td><td>{formatDateTime(p.dataHoraSaida)}</td><td><StatusBadge value={p.status}/></td><td>{p.origem||'—'}</td></tr>)}</DataTable>{!lista.length&&<Empty/>}</section>}</>;
}

function CadastrosPage() {
  const turmas = useLoad(async()=>getData(await api('/turmas'),[]),[]); const disciplinas=useLoad(async()=>getData(await api('/disciplinas'),[]),[]);
  if(turmas.loading||disciplinas.loading)return <Loading/>; if(turmas.error)return <ErrorBox error={turmas.error} onRetry={turmas.reload}/>; if(disciplinas.error)return <ErrorBox error={disciplinas.error} onRetry={disciplinas.reload}/>;
  return <><PageHeader title="Turmas e disciplinas" description="Estrutura acadêmica usada pelas regras de presença."/><div className="two-columns"><section className="panel"><div className="panel-head"><h2>Turmas</h2></div><DataTable columns={['Nome','Turno','Ano','Sala']}>{rows(turmas.data).map(t=><tr key={t.id}><td><strong>{t.nome}</strong></td><td>{t.turno}</td><td>{t.anoLetivo}</td><td>{t.sala||'—'}</td></tr>)}</DataTable></section><section className="panel"><div className="panel-head"><h2>Disciplinas</h2></div><DataTable columns={['Disciplina','Código','Professor']}>{rows(disciplinas.data).map(d=><tr key={d.id}><td><strong>{d.nome}</strong></td><td>{d.codigo||'—'}</td><td>{d.professor||'—'}</td></tr>)}</DataTable></section></div></>;
}

function BiometriaPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [camera, setCamera] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [generatedCode, setGeneratedCode] = useState('');
  const [factorStatus, setFactorStatus] = useState(null);

  const alunos = useLoad(
    async () =>
      getData(
        await api('/alunos?page=1&limit=100'),
        {}
      ),
    []
  );

  const list = rows(alunos.data);

  const selected = list.find(
    (aluno) => aluno.id === studentId
  );

  useEffect(() => {
    return () => {
      streamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!studentId) {
      setFactorStatus(null);
      return;
    }

    api(`/alunos/${studentId}/segundo-fator`)
      .then((response) =>
        setFactorStatus(
          getData(response, {})
        )
      )
      .catch(() =>
        setFactorStatus(null)
      );
  }, [studentId]);

  function waitForVideoReady(
    video,
    timeout = 3000
  ) {
    if (
      video?.videoWidth &&
      video?.videoHeight
    ) {
      return Promise.resolve();
    }

    return new Promise(
      (resolve, reject) => {
        let timer = null;

        const cleanup = () => {
          clearTimeout(timer);

          video.removeEventListener(
            'loadedmetadata',
            finish
          );

          video.removeEventListener(
            'canplay',
            finish
          );
        };

        const finish = () => {
          cleanup();

          if (
            video.videoWidth &&
            video.videoHeight
          ) {
            resolve();
          } else {
            reject(
              new Error(
                'A câmera abriu, mas o vídeo ainda não ficou pronto.'
              )
            );
          }
        };

        timer = setTimeout(
          () => {
            cleanup();

            reject(
              new Error(
                'A câmera demorou demais para ficar pronta.'
              )
            );
          },
          timeout
        );

        video.addEventListener(
          'loadedmetadata',
          finish,
          {
            once: true,
          }
        );

        video.addEventListener(
          'canplay',
          finish,
          {
            once: true,
          }
        );
      }
    );
  }

  async function openCamera() {
    setError('');

    const video =
      videoRef.current;

    if (!video) {
      throw new Error(
        'Elemento de vídeo não encontrado.'
      );
    }

    /*
      Se a câmera já estiver aberta,
      não abre outro stream.
    */
    if (
      streamRef.current?.active &&
      video.srcObject ===
        streamRef.current
    ) {
      await waitForVideoReady(
        video
      );

      setCamera(true);

      return;
    }

    if (
      !navigator.mediaDevices
        ?.getUserMedia
    ) {
      throw new Error(
        'Este navegador não oferece acesso à câmera.'
      );
    }

    const newStream =
      await navigator.mediaDevices.getUserMedia(
        {
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
        }
      );

    /*
      Encerra stream antigo caso exista.
    */
    if (
      streamRef.current &&
      streamRef.current !==
        newStream
    ) {
      streamRef.current
        .getTracks()
        .forEach(
          (track) =>
            track.stop()
        );
    }

    streamRef.current =
      newStream;

    if (
      video.srcObject !==
      newStream
    ) {
      video.srcObject =
        newStream;
    }

    video.muted = true;
    video.playsInline = true;

    try {
      await video.play();
    } catch (playError) {
      /*
        Esse erro pode acontecer no
        Chrome/WebView sem a câmera
        realmente ter falhado.
      */
      if (
        playError?.name !==
        'AbortError'
      ) {
        newStream
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          );

        streamRef.current =
          null;

        throw playError;
      }
    }

    await waitForVideoReady(
      video
    );

    setCamera(true);
  }

  async function capture() {
    const video =
      videoRef.current;

    const canvas =
      canvasRef.current;

    if (
      !video ||
      !canvas
    ) {
      throw new Error(
        'Câmera indisponível.'
      );
    }

    await waitForVideoReady(
      video
    );

    /*
      Antes o cadastro enviava
      a resolução completa.

      Agora limitamos a 1024px.
      Isso reduz upload e processamento.
    */
    const maxWidth = 1280;

    const scale = Math.min(
      1,
      maxWidth /
        video.videoWidth
    );

    canvas.width =
      Math.round(
        video.videoWidth *
          scale
      );

    canvas.height =
      Math.round(
        video.videoHeight *
          scale
      );

    const context =
      canvas.getContext(
        '2d',
        {
          alpha: false,
        }
      );

    if (!context) {
      throw new Error(
        'Não foi possível preparar a captura.'
      );
    }

    context.drawImage(
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

          0.92
        );
      }
    );
  }

  async function sendEnrollmentPhoto(
    photoNumber,
    token
  ) {
    const blob =
      await capture();

    const form =
      new FormData();

    form.append(
      'numero_foto',
      String(photoNumber)
    );

    form.append(
      'enrollment_token',
      token
    );

    form.append(
      'file',
      blob,
      `foto-${photoNumber}.jpg`
    );

    const response =
      await fetch(
        `${PYTHON_API_URL}/cadastrar`,
        {
          method: 'POST',

          body: form,
        }
      );

    const payload =
      await response
        .json()
        .catch(
          () => ({})
        );

    if (
      !response.ok ||
      payload.status !==
        'sucesso'
    ) {
      throw new Error(
        payload.detail ||
          payload.mensagem ||
          `Falha na foto ${photoNumber}.`
      );
    }

    return payload;
  }

  async function enroll() {
    if (
      !studentId ||
      !password
    ) {
      setError(
        'Selecione um aluno e confirme sua senha.'
      );

      return;
    }

    setBusy(true);
    setError('');

    setMessage(
      'Autorizando cadastro...'
    );

    setGeneratedCode('');
    setStep(0);

    try {
      const auth =
        getData(
          await api(
            '/ia/sessao-cadastro',
            {
              method:
                'POST',

              body:
                JSON.stringify(
                  {
                    alunoId:
                      studentId,

                    senha:
                      password,
                  }
                ),
            }
          ),

          {}
        );

      const token =
        auth.enrollmentToken;

      if (!token) {
        throw new Error(
          'Backend não retornou autorização biométrica.'
        );
      }

      /*
        Mesmo que a câmera já esteja aberta,
        openCamera reutiliza o stream.
      */
      await openCamera();

      const guides = [
        'Olhe de frente para a câmera',
        'Gire levemente para a esquerda',
        'Gire levemente para a direita',
      ];

      /*
        Antes eram 2000ms.

        Agora só 800ms.
        De 6 segundos fixos cai para 2,4.
      */
      const positioningDelay =
        800;

      for (
        let index = 0;
        index < 3;
        index += 1
      ) {
        const photoNumber =
          index + 1;

        setStep(
          photoNumber
        );

        setMessage(
          `${guides[index]} • preparando foto ${photoNumber}/3...`
        );

        await new Promise(
          (resolve) => {
            setTimeout(
              resolve,
              positioningDelay
            );
          }
        );

        setMessage(
          `${guides[index]} • processando foto ${photoNumber}/3...`
        );

        await sendEnrollmentPhoto(
          photoNumber,
          token
        );

        setMessage(
          `Foto ${photoNumber}/3 concluída.`
        );
      }

      setMessage(
        `Biometria de ${
          selected?.nome ||
          'aluno'
        } cadastrada com sucesso.`
      );

      setPassword('');
      setStep(0);

      await alunos.reload();
    } catch (err) {
      setError(
        err.message ||
          'Falha no cadastro biométrico.'
      );

      setMessage('');
      setStep(0);
    } finally {
      setBusy(false);
    }
  }

  async function generateFactor() {
    if (!studentId) {
      return;
    }

    setError('');

    try {
      const data =
        getData(
          await api(
            `/alunos/${studentId}/segundo-fator`,
            {
              method:
                'POST',
            }
          ),

          {}
        );

      setGeneratedCode(
        data.codigo || ''
      );

      setFactorStatus({
        ativo: true,

        atualizadoEm:
          new Date()
            .toISOString(),
      });
    } catch (err) {
      setError(
        err.message ||
          'Não foi possível gerar o segundo fator.'
      );
    }
  }

  async function disableFactor() {
    if (!studentId) {
      return;
    }

    setError('');

    try {
      await api(
        `/alunos/${studentId}/segundo-fator`,
        {
          method:
            'DELETE',
        }
      );

      setFactorStatus({
        ativo: false,
      });

      setGeneratedCode('');
    } catch (err) {
      setError(
        err.message ||
          'Não foi possível desativar o segundo fator.'
      );
    }
  }

  return (
    <>
      <PageHeader
        title="Cadastro biométrico"
        description="Área restrita. Captura rápida de três ângulos com autorização temporária."
      />

      <div className="biometric-grid">

        <section className="panel biometric-camera">

          <div className="panel-head">

            <div>

              <h2>
                Captura facial
              </h2>

              <p>
                Frente, esquerda e direita para melhorar a identificação.
              </p>

            </div>

            <span className="security-chip">
              Reautenticação obrigatória
            </span>

          </div>

          <div className="webcam-box">

            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className={
                camera
                  ? ''
                  : 'camera-video-hidden'
              }
            />

            {!camera && (

              <button
                type="button"
                className="camera-placeholder"

                onClick={() => {
                  openCamera()
                    .catch(
                      (err) => {
                        setError(
                          `Não foi possível abrir a câmera: ${
                            err.message ||
                            'erro desconhecido'
                          }`
                        );
                      }
                    );
                }}
              >

                <span>
                  ◎
                </span>

                <strong>
                  Ativar câmera
                </strong>

                <small>
                  A câmera só é usada durante o cadastro.
                </small>

              </button>

            )}

            <canvas
              ref={canvasRef}
              hidden
            />

          </div>

          <div className="capture-progress">

            {[1, 2, 3].map(
              (number) => (

                <span
                  key={
                    number
                  }

                  className={
                    step ===
                    number
                      ? 'active'
                      : step >
                          number
                      ? 'done'
                      : ''
                  }
                >

                  {step >
                  number
                    ? '✓'
                    : number}

                </span>

              )
            )}

          </div>

          {message && (

            <div className="notice success">
              {message}
            </div>

          )}

          {error && (

            <div className="notice error">
              {error}
            </div>

          )}

          <div className="form-grid">

            <label>

              Aluno

              <select
                value={
                  studentId
                }

                onChange={
                  (event) => {
                    setStudentId(
                      event.target
                        .value
                    );

                    setError('');
                    setMessage('');
                    setStep(0);
                  }
                }
              >

                <option value="">
                  Selecione...
                </option>

                {list.map(
                  (aluno) => (

                    <option
                      key={
                        aluno.id
                      }

                      value={
                        aluno.id
                      }
                    >
                      {aluno.nome}
                      {' • '}
                      {
                        aluno.matricula
                      }
                      {' • '}
                      {aluno
                        .turmas?.[0]
                        ?.turma
                        ?.nome ||
                        'sem turma'}
                    </option>

                  )
                )}

              </select>

            </label>

            <label>

              Confirme sua senha

              <input
                type="password"

                value={
                  password
                }

                onChange={
                  (event) =>
                    setPassword(
                      event.target
                        .value
                    )
                }

                placeholder="Senha do operador"

                autoComplete="current-password"
              />

            </label>

          </div>

          <button
            type="button"

            className="button primary block"

            onClick={
              enroll
            }

            disabled={
              busy ||
              !studentId ||
              !password
            }
          >

            {busy
              ? 'Capturando biometria...'
              : 'Autorizar e cadastrar 3 fotos'}

          </button>

        </section>

        <aside className="panel factor-panel">

          <div className="panel-head">

            <div>

              <h2>
                Casos especiais / gêmeos
              </h2>

              <p>
                Segundo fator para situações em que dois rostos ficam muito semelhantes.
              </p>

            </div>

          </div>

          {!selected ? (

            <Empty>
              Selecione um aluno para configurar.
            </Empty>

          ) : (
            <>

              <div className="student-summary">

                <strong>
                  {selected.nome}
                </strong>

                <span>
                  {selected.matricula}
                  {' • '}
                  {selected
                    .turmas?.[0]
                    ?.turma
                    ?.nome ||
                    'sem turma'}
                </span>

              </div>

              <div
                className={`factor-status ${
                  factorStatus?.ativo
                    ? 'on'
                    : ''
                }`}
              >

                <span>

                  {factorStatus?.ativo
                    ? 'Proteção adicional ATIVA'
                    : 'Proteção adicional desativada'}

                </span>

                <small>

                  {factorStatus?.ativo
                    ? 'Código adicional disponível para confirmação em situações ambíguas.'
                    : 'Ative para gêmeos ou casos com maior risco de falso reconhecimento.'}

                </small>

              </div>

              {generatedCode && (

                <div className="secret-code">

                  <span>
                    Código gerado — exibir uma única vez
                  </span>

                  <strong>
                    {generatedCode}
                  </strong>

                  <small>
                    Entregue somente ao aluno correto.
                  </small>

                </div>

              )}

              <button
                type="button"

                className="button primary block"

                onClick={
                  generateFactor
                }
              >

                Gerar / trocar código de 6 dígitos

              </button>

              {factorStatus?.ativo && (

                <button
                  type="button"

                  className="button secondary block"

                  onClick={
                    disableFactor
                  }
                >

                  Desativar segundo fator

                </button>

              )}

            </>
          )}

        </aside>

      </div>
    </>
  );
}

function JustificativasPage(){const[status,setStatus]=useState('PENDENTE');const r=useLoad(async()=>getData(await api(`/justificativas?status=${status}`),[]),[status]);async function decide(id,a){try{await api(`/justificativas/${id}/${a}`,{method:'PATCH'});await r.reload();}catch(e){alert(e.message)}}return <><PageHeader title="Justificativas" description="Análise administrativa de ausências." actions={<select value={status} onChange={e=>setStatus(e.target.value)}><option>PENDENTE</option><option>APROVADO</option><option>REJEITADO</option></select>}/>{r.loading?<Loading/>:r.error?<ErrorBox error={r.error} onRetry={r.reload}/>:<section className="panel"><DataTable columns={['Aluno','Turma','Motivo','Criada em','Status','Ações']}>{rows(r.data).map(j=><tr key={j.id}><td><strong>{j.presenca?.aluno?.nome||'—'}</strong></td><td>{j.presenca?.turma?.nome||'—'}</td><td className="wide-cell">{j.motivo}</td><td>{formatDateTime(j.criadoEm)}</td><td><StatusBadge value={j.status}/></td><td>{j.status==='PENDENTE'?<div className="row-actions"><button className="mini success" onClick={()=>decide(j.id,'aprovar')}>Aprovar</button><button className="mini danger" onClick={()=>decide(j.id,'rejeitar')}>Rejeitar</button></div>:'—'}</td></tr>)}</DataTable>{!rows(r.data).length&&<Empty/>}</section>}</>}
function AlertasPage(){const r=useLoad(async()=>getData(await api('/alertas'),[]),[]);async function resolve(id){try{await api(`/alertas/${id}/resolver`,{method:'PATCH'});r.reload()}catch(e){alert(e.message)}}return <><PageHeader title="Alertas de frequência" description="Acompanhamento de alunos abaixo do limiar configurado." actions={<button className="button secondary" onClick={r.reload}>Atualizar</button>}/>{r.loading?<Loading/>:r.error?<ErrorBox error={r.error} onRetry={r.reload}/>:<section className="panel"><DataTable columns={['Aluno','Turma','Mensagem','Criado em','Ação']}>{rows(r.data).map(a=><tr key={a.id}><td><strong>{a.aluno?.nome||'—'}</strong></td><td>{a.turma?.nome||'Geral'}</td><td className="wide-cell">{a.mensagem}</td><td>{formatDateTime(a.criadoEm)}</td><td><button className="mini" onClick={()=>resolve(a.id)}>Resolver</button></td></tr>)}</DataTable>{!rows(r.data).length&&<Empty>Nenhum alerta aberto.</Empty>}</section>}</>}
function RelatoriosPage(){const baixa=useLoad(async()=>getData(await api('/relatorios/secretaria/baixa-frequencia?limiar=75'),[]),[]);const mensal=useLoad(async()=>{const d=getData(await api('/relatorios/mensal'),{});return Array.isArray(d)?d[0]||{}:d||{}},[]);if(baixa.loading||mensal.loading)return <Loading/>;if(baixa.error)return <ErrorBox error={baixa.error} onRetry={baixa.reload}/>;if(mensal.error)return <ErrorBox error={mensal.error} onRetry={mensal.reload}/>;const e=mensal.data?.estatisticas||{};return <><PageHeader title="Relatórios" description="Indicadores calculados no Backend, mantendo a regra de negócio centralizada."/><div className="metrics"><Metric title="Registros no mês" value={e.TOTAL??0} hint={mensal.data?.mes||'Mês atual'}/><Metric title="Comparecimentos" value={(e.PRESENTE??0)+(e.ATRASO??0)+(e.SAIDA_ANTECIPADA??0)} hint="Presença + atraso + saída antecipada" tone="good"/><Metric title="Ausências" value={e.AUSENTE??0} hint={`${e.JUSTIFICADO??0} justificadas`} tone="danger"/><Metric title="Alunos em risco" value={rows(baixa.data).length} hint="Frequência abaixo de 75%" tone="warn"/></div><section className="panel"><DataTable columns={['Aluno','Matrícula','Frequência','Risco']}>{rows(baixa.data).map(a=><tr key={a.alunoId}><td><strong>{a.nome}</strong></td><td>{a.matricula}</td><td>{Number(a.frequencia).toFixed(2)}%</td><td><span className="status status-ausente">Em risco</span></td></tr>)}</DataTable>{!rows(baixa.data).length&&<Empty>Nenhum aluno abaixo do limiar.</Empty>}</section></>}
function AuditoriaPage(){const r=useLoad(async()=>getData(await api('/auditoria'),[]),[]);return <><PageHeader title="Auditoria" description="Rastreabilidade de operações administrativas e de segurança." actions={<button className="button secondary" onClick={r.reload}>Atualizar</button>}/>{r.loading?<Loading/>:r.error?<ErrorBox error={r.error} onRetry={r.reload}/>:<section className="panel"><DataTable columns={['Data','Ação','Entidade','Usuário','ID relacionado']}>{rows(r.data).map(x=><tr key={x.id}><td>{formatDateTime(x.criadoEm)}</td><td><strong>{x.acao}</strong></td><td>{x.entidade}</td><td>{x.usuario?.nome||x.usuarioId||'Sistema'}</td><td className="mono">{x.entidadeId||'—'}</td></tr>)}</DataTable></section>}</>}
function CozinhaPage(){const[data,setData]=useState(todaySP());const r=useLoad(async()=>{const d=getData(await api(`/relatorios/cozinha?data=${data}`),{});return Array.isArray(d)?d[0]||{}:d||{}},[data]);if(r.loading)return <Loading/>;if(r.error)return <ErrorBox error={r.error} onRetry={r.reload}/>;const d=r.data||{};return <><PageHeader title="Previsão da cozinha" description="Quantitativos operacionais sem exposição de biometria." actions={<input type="date" value={data} onChange={e=>setData(e.target.value)}/>}/><div className="metrics"><Metric title="Manhã" value={d.MANHA??0} hint="Alunos previstos"/><Metric title="Tarde" value={d.TARDE??0} hint="Alunos previstos"/><Metric title="Noite" value={d.NOITE??0} hint="Alunos previstos"/><Metric title="Total" value={d.TOTAL??0} hint="Previsão diária" tone="good"/></div></>}

function SistemaPage(){const[checks,setChecks]=useState(null);const[loading,setLoading]=useState(false);async function check(){setLoading(true);const base=API_URL.replace(/\/api\/v1$/,'');const items=await Promise.allSettled([fetch(`${base}/api/health`),fetch(`${base}/api/health/ready`),fetch(`${PYTHON_API_URL}/health`)]);setChecks(items.map((x,i)=>({name:['Backend Node','PostgreSQL / readiness','Python IA'][i],ok:x.status==='fulfilled'&&x.value.ok,status:x.status==='fulfilled'?x.value.status:'offline'})));setLoading(false)}useEffect(()=>{check()},[]);return <><PageHeader title="Saúde do sistema" description="Checklist operacional antes da banca ou início do turno." actions={<button className="button secondary" onClick={check}>Verificar agora</button>}/>{loading?<Loading text="Verificando serviços..."/>:<section className="health-grid">{(checks||[]).map(c=><article className={`health-card ${c.ok?'ok':'bad'}`} key={c.name}><span className="health-dot"/><div><strong>{c.name}</strong><p>{c.ok?'Operacional':`Indisponível / HTTP ${c.status}`}</p></div></article>)}</section>}<section className="panel"><div className="panel-head"><div><h2>Checklist rápido</h2><p>Antes de abrir o terminal Flutter.</p></div></div><ol className="checklist"><li>PostgreSQL iniciado e schema sincronizado.</li><li>Backend Node respondendo em readiness.</li><li>Python com banco facial carregado e IA_API_KEY correta.</li><li>Tablet e servidor na mesma rede quando usar dispositivo físico.</li><li>Faça um reconhecimento de teste antes da apresentação.</li></ol></section></>}

function Shell({ user, onLogout }) {
  const nav=useMemo(()=>{if(user.role==='COZINHA')return [['cozinha','Cozinha']];const b=[['dashboard','Visão geral'],['alunos','Alunos'],['presencas','Presenças'],['cadastros','Turmas e disciplinas']];if(['ADMIN','SECRETARIA'].includes(user.role))b.push(['biometria','Biometria'],['justificativas','Justificativas'],['alertas','Alertas'],['relatorios','Relatórios'],['sistema','Saúde do sistema']);if(user.role==='PROFESSOR')b.push(['alertas','Alertas']);if(user.role==='ADMIN')b.push(['auditoria','Auditoria']);return b},[user.role]);
  const[page,setPage]=useState(nav[0][0]);
  const pages={dashboard:<DashboardPage/>,alunos:<AlunosPage/>,presencas:<PresencasPage/>,cadastros:<CadastrosPage/>,biometria:<BiometriaPage/>,justificativas:<JustificativasPage/>,alertas:<AlertasPage/>,relatorios:<RelatoriosPage/>,auditoria:<AuditoriaPage/>,cozinha:<CozinhaPage/>,sistema:<SistemaPage/>};
  return <div className="app-shell"><aside className="sidebar"><Brand compact/><nav>{nav.map(([id,label])=><button key={id} className={page===id?'active':''} onClick={()=>setPage(id)}><span className="nav-mark"/>{label}</button>)}</nav><div className="sidebar-foot"><span><i/> API configurada</span><small>{API_URL}</small></div></aside><div className="main-area"><header className="topbar"><div><strong>Sistema de Presença Escolar</strong><span>SESI • reconhecimento facial e frequência</span></div><div className="user-box"><span className="avatar">{(user.nome||'U').split(/\s+/).slice(0,2).map(p=>p[0]).join('').toUpperCase()}</span><div><strong>{user.nome}</strong><span>{ROLE_LABEL[user.role]||user.role}</span></div><button className="text-button" onClick={onLogout}>Sair</button></div></header><main className="content">{pages[page]}</main></div></div>;
}

export default function App(){const initial=readSession();const[user,setUser]=useState(initial.user);const[checking,setChecking]=useState(Boolean(initial.accessToken));useEffect(()=>{if(!readSession().accessToken){setChecking(false);return}api('/auth/me').then(p=>{const profile=getData(p,null);if(!profile)throw new ApiError('Perfil inválido.');if(profile.role==='SISTEMA_IA')throw new ApiError('Perfil de serviço não acessa o Dashboard.');saveSession({...readSession(),user:profile});setUser(profile)}).catch(()=>{clearSession();setUser(null)}).finally(()=>setChecking(false))},[]);async function sair(){await logout();setUser(null)}if(checking)return <div className="boot"><span className="spinner"/><strong>Validando sessão...</strong></div>;if(!user)return <Login onSuccess={setUser}/>;return <Shell user={user} onLogout={sair}/>}
