import Image from "next/image";


const cases = [
  {
    title:"某高校岸基充电站项目安装调试完",
    image:"/images/case/case-1.png",
    date:"2025-12-28",
    desc:
      "该项目采用30kWh光储式岸基充电系统，依托“光伏储电-设备补电”闭环技术，为高校教学船、科研实验设备提供稳定绿色电力支持。项目的成功落地，不仅丰富了汉理新能源在教育科研领域的应用案例，更拓宽了岸基储能充电系统的场景边界，为后续校园、园区等场景的绿色改造积累了实践经验。",
  },
  {
    title:"德清乾元造船厂首台船电宝安装工作圆满落幕",
    image:"/images/case/case-2.png",
    date:"2025-11-12",
    desc:
      "作为船舶制造环节的绿色配套设备，该产品从设计阶段即结合造船厂船舶构造特点优化适配方案，安装过程中实现与船舶电力系统无缝衔接。此次合作标志着汉理新能源将绿色能源解决方案前置到船舶制造环节，构建“造船-配套-运维”全链条绿色服务体系。",
  },
];



export default function CaseList(){


return (

<section
className="
w-full
bg-[#eef8ff]
py-16
md:py-20
"
>


<div
className="
mx-auto
max-w-[1280px]
px-5
md:px-8
"
>


{/* 标题 */}

<div
className="
mb-12
text-center
"
>

<h2
className="
text-3xl
font-bold
text-[#2463c5]
md:text-4xl
"
>
应用案例
</h2>

</div>



{/* 列表 */}

<div
className="
grid
grid-cols-1
gap-10
md:grid-cols-2
"
>


{
cases.map(item=>(


<article
key={item.title}
className="
group
overflow-hidden
"
>


{/* 图片 */}

<div
className="
relative
aspect-[16/9]
overflow-hidden
"
>

<Image
src={item.image}
alt={item.title}
fill
className="
object-cover
transition
duration-500
group-hover:scale-105
"
/>

</div>




<div
className="
pt-7
"
>


<h3
className="
text-xl
font-bold
leading-8
text-[#102a43]
md:text-2xl
"
>
{item.title}
</h3>



<p
className="
mt-5
text-[15px]
leading-8
text-[#334e68]
md:text-base
"
>
{item.desc}
</p>




<div
className="
mt-6
flex
items-center
justify-between
"
>


<time
className="
text-lg
font-bold
text-[#102a43]
"
>
{item.date}
</time>



<button
className="
text-[#2463c5]
font-semibold
transition
hover:translate-x-1
"
>
查看详情 →
</button>


</div>


</div>



</article>


))
}


</div>



</div>


</section>


)

}