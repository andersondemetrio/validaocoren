import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, Check } from 'lucide-react'; // Removed X as it wasn't used

const OcorenParser = () => {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Códigos de ocorrência conforme documentação
  const occurrenceCodes = {
    '09': 'Cancelado',
    '10': 'Processo de transporte já iniciado/carga coletada',
    '11': 'Reentrega solicitada pelo cliente',
    '12': 'Em transferência entre unidades',
    '13': 'Carga redespachada (entregue para redespacho)',
    '14': 'Em devolução',
    '15': 'Emissão do CT-e / NFS-e',
    '16': 'Carga em tratamento em uma unidade da transportadora',
    '17': 'Entrega agendada / programada',
    '18': 'Chegada na cidade ou unidade de destino',
    '19': 'Carga está em trânsito',
    '20': 'O status anterior continua válido',
    '21': 'Transportadora está a caminho para realizar a coleta',
    '22': 'A carga chegou em uma unidade da transportadora',
    '23': 'A carga saiu de uma unidade da transportadora',
    '30': 'Em rota final para entrega nos próximos dias',
    '31': 'Em rota final para entrega ainda hoje',
    '32': 'Carga aguardando retirada no local definido',
    '35': 'Entrega ao destinatário realizada com sucesso',
    '36': 'Carga entregue em uma localidade diferente, mas relacionada ao destinatário',
    '37': 'Entrega final realizada para retirada em local definido',
    '38': 'Carga retirada pelo cliente final no local definido',
    '40': 'Carga devolvida ao remetente',
    '41': 'Roubo de carga',
    '42': 'Avaria total',
    '43': 'Extravio total',
    '44': 'Falha definitiva na entrega',
    '45': 'Carga descartada pela transportadora',
    '50': 'Falta de espaço físico no depósito do cliente destino',
    '51': 'Endereço de entrega não localizado',
    '52': 'Transportadora não pôde realizar a entrega/coleta. Aguardando instruções',
    '53': 'Problema operacional',
    '54': 'Duplicidade de carga',
    '55': 'Carga errada ou incompleta',
    '56': 'Entrega prejudicada por horário/falta de tempo hábil',
    '57': 'Estabelecimento fechado',
    '58': 'Falha na entrega. Carga na transportadora. Aguardando retirada pelo cliente',
    '59': 'Problemas fiscais ou com documentação (Nota Fiscal e/ou CTRC)',
    '60': 'Quantidade de produto em desacordo (Nota fiscal e/ou pedido)',
    '61': 'Feriado',
    '62': 'Cliente destino faliu/faleceu',
    '63': 'Responsável de recebimento ausente',
    '64': 'Greve geral',
    '65': 'Carga vencida',
    '66': 'Problemas no pagamento do frete',
    '67': 'Destinatário sem identificação/documentação necessária para realizar o recebimento',
    '68': 'Difícil acesso ao local',
    '69': 'Cliente destino mudou de endereço',
    '70': 'Carga recusada pela transportadora (peso/dimensões/perfil)',
    '71': 'A transportadora não conseguiu inserir a carga no fluxo postal',
    '72': 'Transportadora não atende o endereço destino',
    '73': 'Carga recusada pelo destinatário',
    '74': 'Houve uma tentativa de entrega, mas o destinatário não foi identificado',
    '75': 'A transportadora informou que haverá um atraso na operação',
    '76': 'A transportadora precisa de mais informações para continuar com a entrega',
    '77': 'A carga está com a transportadora, mas não está conseguindo avançar',
    '78': 'Destinatário não localizado no endereço de destino',
    '79': 'A transportadora não conseguiu identificar o endereço do destinatário por falta de informação',
    '80': 'Fatores naturais que impossibilitaram o avanço da carga',
    '81': 'A entrega foi cancelada pelo remetente antes da primeira tentativa de entrega',
    '82': 'Houve uma devolução, porem o remetente recusou a carga no recebimento. A carga voltou para a transportadora',
    '83': 'Destinatário está localizado em uma área de entrega diferenciada',
    '84': 'Evento anterior informado erroneamente pela transportadora. Considerar o evento que o antecede',
    '85': 'Status da carga sendo investigado',
    '86': 'A transportadora entregou a carga para um destinatário errado',
    '87': 'Carga parcialmente danificado durante o fluxo na transportadora. Não será possível fazer a entrega total',
    '88': 'Carga parcialmente perdida durante o fluxo na transportadora. Não será foi possível fazer a entrega total',
    '99': 'Outros tipos de ocorrências não especificados acima'
  };

  const observationCodes = {
    '01': 'Devolução/recusa total',
    '02': 'Devolução/recusa parcial',
    '03': 'Aceite/entrega por acordo'
  };

  const parseRecord000 = (line) => {
    return {
      type: 'UNB - Cabeçalho de Intercâmbio',
      identificador: line.substring(0, 3),
      remetente: line.substring(3, 38).trim(),
      destinatario: line.substring(38, 73).trim(),
      data: line.substring(73, 79),
      hora: line.substring(79, 83),
      identificacaoIntercambio: line.substring(83, 95).trim(),
      filler: line.substring(95, 120).trim()
    };
  };

  const parseRecord340 = (line) => {
    return {
      type: 'UNH - Cabeçalho de Documento',
      identificador: line.substring(0, 3),
      identificacaoDocumento: line.substring(3, 17).trim(),
      filler: line.substring(17, 120).trim()
    };
  };

  const parseRecord341 = (line) => {
    return {
      type: 'TRA - Dados da Transportadora',
      identificador: line.substring(0, 3),
      cgc: line.substring(3, 17).trim(),
      razaoSocial: line.substring(17, 57).trim(),
      filler: line.substring(57, 120).trim()
    };
  };

  const parseRecord342 = (line) => {
    const occurrenceCode = line.substring(28, 30);
    const observationCode = line.substring(42, 44);
    
    return {
      type: 'OEN - Ocorrência na Entrega',
      identificador: line.substring(0, 3),
      cgcEmpresaEmissora: line.substring(3, 17).trim(),
      serieNotaFiscal: line.substring(17, 20).trim(),
      numeroNotaFiscal: line.substring(20, 28).trim(),
      codigoOcorrencia: occurrenceCode,
      descricaoOcorrencia: occurrenceCodes[occurrenceCode] || 'Código não encontrado',
      dataOcorrencia: line.substring(30, 38),
      horaOcorrencia: line.substring(38, 42),
      codigoObservacao: observationCode,
      descricaoObservacao: observationCodes[observationCode] || '',
      textoLivre: line.substring(44, 114).trim(),
      filler: line.substring(114, 120).trim()
    };
  };

  const parseRecord343 = (line) => {
    return {
      type: 'OEN - Redespacho',
      identificador: line.substring(0, 3),
      cgcEmpresaContratante: line.substring(3, 17).trim(),
      filialEmissora: line.substring(17, 27).trim(),
      serieConhecimento: line.substring(27, 32).trim(),
      numeroConhecimento: line.substring(32, 44).trim(),
      filler: line.substring(44, 120).trim()
    };
  };

  const parseOcorenFile = (content) => {
    const lines = content.split('\n').filter(line => line.trim());
    const parsedRecords = [];

    for (const line of lines) {
      if (line.length < 120) continue;

      const recordType = line.substring(0, 3);
      
      try {
        switch (recordType) {
          case '000':
            parsedRecords.push(parseRecord000(line));
            break;
          case '340':
            parsedRecords.push(parseRecord340(line));
            break;
          case '341':
            parsedRecords.push(parseRecord341(line));
            break;
          case '342':
            parsedRecords.push(parseRecord342(line));
            break;
          case '343':
            parsedRecords.push(parseRecord343(line));
            break;
          default:
            parsedRecords.push({
              type: 'Registro não reconhecido',
              identificador: recordType,
              linha: line
            });
        }
      } catch (err: any) { // Explicitly type err as any
        parsedRecords.push({
          type: 'Erro ao processar',
          identificador: recordType,
          erro: err.message,
          linha: line
        });
      }
    }

    return parsedRecords;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => { // Explicitly type event
    const uploadedFile = event.target.files?.[0]; // Use optional chaining
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);
    setError(null);

    try {
      const content = await uploadedFile.text();
      const parsed = parseOcorenFile(content);
      setParsedData(parsed);
    } catch (err: any) { // Explicitly type err as any
      setError('Erro ao processar arquivo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => { // Explicitly type dateStr
    if (!dateStr || dateStr.length !== 8) return dateStr;
    return `${dateStr.substring(0, 2)}/${dateStr.substring(2, 4)}/${dateStr.substring(4, 8)}`;
  };

  const formatTime = (timeStr: string) => { // Explicitly type timeStr
    if (!timeStr || timeStr.length !== 4) return timeStr;
    return `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}`;
  };

  const getStatusClass = (type: string) => { // Renamed from getStatusColor to getStatusClass for CSS classes
    switch (type) {
      case 'UNB - Cabeçalho de Intercâmbio':
        return 'status-unb';
      case 'UNH - Cabeçalho de Documento':
        return 'status-unh';
      case 'TRA - Dados da Transportadora':
        return 'status-tra';
      case 'OEN - Ocorrência na Entrega':
        return 'status-oen-entrega';
      case 'OEN - Redespacho':
        return 'status-oen-redespacho';
      default:
        return 'status-default';
    }
  };

  return (
    <div className="ocoren-parser-container">
      <div className="ocoren-parser-content">
        <div className="ocoren-parser-header">
          <FileText className="ocoren-parser-icon" />
          <h1 className="ocoren-parser-title">Validador de Arquivos OCOREN</h1>
        </div>

        <div className="ocoren-parser-upload-section">
          <label className="ocoren-parser-label">
            Selecione o arquivo OCOREN
          </label>
          <div className="ocoren-parser-file-input-wrapper">
            <label className="ocoren-parser-file-input">
              <div className="ocoren-parser-file-input-content">
                <Upload className="ocoren-parser-upload-icon" />
                <p className="ocoren-parser-upload-text">
                  <span>Clique para upload</span> ou arraste o arquivo
                </p>
                <p className="ocoren-parser-upload-subtext">Apenas arquivos .txt são aceitos</p>
              </div>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="ocoren-parser-hidden-input"
              />
            </label>
          </div>
        </div>

        {file && (
          <div className="ocoren-parser-selected-file">
            <div className="ocoren-parser-selected-file-content">
              <FileText className="ocoren-parser-selected-file-icon" />
              <span className="ocoren-parser-selected-file-name">
                Arquivo selecionado: {file.name}
              </span>
            </div>
          </div>
        )}

        {loading && (
          <div className="ocoren-parser-loading">
            <div className="ocoren-parser-spinner"></div>
            <p className="ocoren-parser-loading-text">Processando arquivo...</p>
          </div>
        )}

        {error && (
          <div className="ocoren-parser-error">
            <div className="ocoren-parser-error-content">
              <AlertCircle className="ocoren-parser-error-icon" />
              <span className="ocoren-parser-error-text">{error}</span>
            </div>
          </div>
        )}

        {parsedData && (
          <div className="ocoren-parser-parsed-data-section">
            <div className="ocoren-parser-parsed-data-header">
              <Check className="ocoren-parser-parsed-data-icon" />
              <h2 className="ocoren-parser-parsed-data-title">
                Dados Processados ({parsedData.length} registros)
              </h2>
            </div>

            <div className="ocoren-parser-records-grid">
              {parsedData.map((record, index) => (
                <div key={index} className="ocoren-parser-record-item">
                  <div className={`ocoren-parser-record-type ${getStatusClass(record.type)}`}>
                    {record.type}
                  </div>
                  
                  <div className="ocoren-parser-record-details-grid">
                    {Object.entries(record).map(([key, value]) => {
                      if (key === 'type') return null;
                      
                      let displayValue = value;
                      if (key === 'dataOcorrencia') {
                        displayValue = formatDate(value as string);
                      } else if (key === 'horaOcorrencia') {
                        displayValue = formatTime(value as string);
                      }

                      return (
                        <div key={key} className="ocoren-parser-record-detail-item">
                          <div className="ocoren-parser-record-detail-key">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div className="ocoren-parser-record-detail-value">
                            {displayValue || '-'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="ocoren-parser-about">
        <h3 className="ocoren-parser-about-title">Sobre o Parser OCOREN</h3>
        <div className="ocoren-parser-about-content">
          <div>
            <h4 className="ocoren-parser-about-subtitle">Tipos de Registro Suportados:</h4>
            <ul className="ocoren-parser-list">
              <li>• <strong>000</strong> - Cabeçalho de Intercâmbio (UNB)</li>
              <li>• <strong>340</strong> - Cabeçalho de Documento (UNH)</li>
              <li>• <strong>341</strong> - Dados da Transportadora (TRA)</li>
              <li>• <strong>342</strong> - Ocorrência na Entrega (OEN)</li>
              <li>• <strong>343</strong> - Redespacho (OEN)</li>
            </ul>
          </div>
          <div>
            <h4 className="ocoren-parser-about-subtitle">Recursos:</h4>
            <ul className="ocoren-parser-list">
              <li>• Processamento de arquivos de texto fixo</li>
              <li>• Decodificação de códigos de ocorrência</li>
              <li>• Formatação de datas e horários</li>
              <li>• Identificação de tipos de observação</li>
              <li>• Tratamento de erros de parsing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OcorenParser;