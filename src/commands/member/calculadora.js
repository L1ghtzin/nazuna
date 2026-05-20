// Reimplementação simplificada da calculadora já que import calculator pode estar ausente ou não funcionar como função estática
export default {
  name: "calculadora",
  description: "Calculadora científica ou conversor de unidades matemáticas simples",
  commands: ["calc", "calcular", "calculadora"],
  usage: `${global.prefix}calc <expressão>`,
  handle: async ({ 
    reply, q, args, prefix,
    MESSAGES
  }) => {
    // Math eval implementation
    const calcMath = (expr) => {
      try {
        // Safe evaluation function allowing math operations
        const mathExpr = expr
          .replace(/sin\(/g, 'Math.sin(')
          .replace(/cos\(/g, 'Math.cos(')
          .replace(/tan\(/g, 'Math.tan(')
          .replace(/sqrt\(/g, 'Math.sqrt(')
          .replace(/log\(/g, 'Math.log10(')
          .replace(/abs\(/g, 'Math.abs(')
          .replace(/ceil\(/g, 'Math.ceil(')
          .replace(/floor\(/g, 'Math.floor(')
          .replace(/pi/gi, 'Math.PI')
          .replace(/e/gi, 'Math.E')
          .replace(/phi/gi, '1.618033988749895')
          .replace(/[^0-9\+\-\*\/\%\(\)\.\sMathA-Z_a-z]/g, '');

        if (!mathExpr.match(/^[0-9A-Za-z\.\(\)\+\-\*\/\s\_]+$/)) throw new Error('Expressão inválida');
        
        // Handle factorials
        let factExpr = mathExpr;
        while(factExpr.includes('!')) {
            factExpr = factExpr.replace(/(\d+)!/g, (match, n) => {
                let num = parseInt(n);
                if(num > 100) return 'Infinity'; // Avoid huge numbers
                let result = 1;
                for(let i = 2; i <= num; i++) result *= i;
                return result;
            });
        }
        
        // Using Function is slightly safer than eval when restricted
        const fn = new Function('return ' + factExpr);
        return fn();
      } catch (err) {
        return null;
      }
    };

    try {
      if (!q) {
        return reply(`🧮 *Calculadora Científica*\n\n${prefix}calc <expressão> - Calcula expressão\n${prefix}calc converter <valor> <de> <para>\n\n*Operadores:* + - * / ^ % !\n*Funções:* sin, cos, tan, sqrt, log, abs, ceil, floor\n*Constantes:* pi, e, phi\n\n*Exemplos:*\n${prefix}calc 2+2*3\n${prefix}calc sqrt(144)\n${prefix}calc sin(45)\n${prefix}calc 5!\n${prefix}calc converter 100 km mi`);
      }
      
      if (args[0]?.toLowerCase() === 'converter' || args[0]?.toLowerCase() === 'convert') {
        const valor = parseFloat(args[1]);
        const de = args[2]?.toLowerCase();
        const para = args[3]?.toLowerCase();
        
        if (isNaN(valor) || !de || !para) {
          return reply(`💔 Formato inválido.\nUso correto: ${prefix}calc converter 100 km mi`);
        }
        
        // Conversões básicas de exemplo
        const convs = {
          'km_mi': v => v * 0.621371,
          'mi_km': v => v / 0.621371,
          'c_f': v => (v * 9/5) + 32,
          'f_c': v => (v - 32) * 5/9,
          'm_cm': v => v * 100,
          'cm_m': v => v / 100,
          'kg_lb': v => v * 2.20462,
          'lb_kg': v => v / 2.20462,
        };
        
        const chave = `${de}_${para}`;
        if (convs[chave]) {
          const resultado = convs[chave](valor);
          return reply(`🔄 *Conversão*\n\n${valor} ${de} = ${resultado.toFixed(2)} ${para}`);
        } else {
          return reply(`💔 Conversão não suportada. Tente: km<>mi, c<>f, m<>cm, kg<>lb`);
        }
      }
      
      const res = calcMath(q);
      if (res !== null && !isNaN(res)) {
        await reply(`🧮 *Calculadora*\n\nExpressão: ${q}\nResultado: *${res}*`);
      } else {
        await reply(`💔 Expressão matemática inválida.`);
      }
      
    } catch (e) {
      console.error('Erro na calculadora:', e);
      reply(`💔 Expressão matemática inválida.`);
    }
  }
};
