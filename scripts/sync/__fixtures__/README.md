# Fixtures de teste — NÃO são dados reais

`smogon-sample-chaos.json` é um arquivo **sintético**, escrito à mão no formato
dos relatórios "chaos" que a Smogon publica em `smogon.com/stats/<mes>/chaos/`,
usado apenas para testar o parser de `scripts/sync/smogon.ts` offline (este
ambiente de desenvolvimento não tem acesso de rede a `smogon.com`).

Os números (usage%, movesets, teammates) são inventados para cobrir os casos
que o parser precisa tratar corretamente — não reflita-os como dados reais do
metagame. Antes de usar o worker em produção, valide com pelo menos um
download real de `smogon.com/stats/` para confirmar que o formato não mudou.

Uso:

```bash
npm run sync:smogon -- --fixture=scripts/sync/__fixtures__/smogon-sample-chaos.json --format=gen9ou
```
