import { prisma } from "../../lib/prisma.js";

export const deleteReservation = async (req, res) => {
  if (!req.user)
    return res
      .status(401)
      .json({
        message: "Je moet ingelogd zijn om je reservering te annuleren",
      });
  if (req.user?.role !== "eigenaar")
    return res
      .status(403)
      .json({ message: "Je bent niet gemachtigd om dit te doen" });
  if (!req.params?.id)
    return res.status(400).json({ message: "Geen reservering ID opgegeven" });

  try {
    const { id } = req.params;

    await prisma.reservation.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      message: "Reservering succesvol geannuleerd!"
    });
  } catch (error) {
    console.error("Fout bij annuleren reservering:", error);
    res
      .status(500)
      .json({ message: "Server fout bij annuleren van reservering" });
  }
};
