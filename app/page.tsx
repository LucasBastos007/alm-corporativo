import { Header }           from "@/components/Header"
import { VendasParceiro }   from "@/components/VendasParceiro"
import { PipelineCRM }      from "@/components/PipelineCRM"
import { FunilAoVivo }      from "@/components/FunilAoVivo"
import { FunilIndividual }  from "@/components/FunilIndividual"
import { ControleFicha }    from "@/components/ControleFicha"
import { Agenda }           from "@/components/Agenda"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <Header />

      <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 max-w-[1600px] w-full mx-auto">

        <VendasParceiro />
        <PipelineCRM />
        <Agenda />
        <FunilAoVivo />
        <FunilIndividual />
        <ControleFicha />

      </main>
    </div>
  )
}
